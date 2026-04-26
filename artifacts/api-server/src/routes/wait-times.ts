import { Router, type IRouter } from "express";
import { findClinicById, createWaitTimeReport, countRecentReports } from "../lib/db-queries";

const VALID_SOURCES = ["CROWDSOURCED_WEB", "CLINIC_DASHBOARD", "SMS"] as const;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;

function hashPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let hash = 2166136261;
  for (let i = 0; i < digits.length; i++) {
    hash ^= digits.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const router: IRouter = Router();

router.post("/wait-times", async (req, res) => {
  const { clinicId, peopleCount, source, phone, visitReason } = req.body as {
    clinicId?: string;
    peopleCount?: unknown;
    source?: string;
    phone?: string;
    visitReason?: string;
  };

  if (!clinicId || typeof peopleCount !== "number" || peopleCount < 0) {
    res.status(400).json({ error: "Missing or invalid fields (clinicId / peopleCount)" });
    return;
  }

  if (!source || !(VALID_SOURCES as readonly string[]).includes(source)) {
    res.status(400).json({ error: `Invalid source: "${source}"` });
    return;
  }

  try {
    const clinic = await findClinicById(clinicId);
    if (!clinic) {
      res.status(404).json({ error: "Clinic not found" });
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `DB lookup error: ${message}` });
    return;
  }

  let phoneHash: string | null = null;
  if (phone) {
    phoneHash = hashPhone(phone);
    try {
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
      const recentCount = await countRecentReports(phoneHash, windowStart);
      if (recentCount >= RATE_LIMIT_MAX) {
        res.status(429).json({
          error: "rate_limited",
          message: "You've submitted too many reports recently. Please try again in 30 minutes.",
        });
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `Rate limit check error: ${message}` });
      return;
    }
  }

  try {
    const report = await createWaitTimeReport({
      clinicId,
      peopleCount,
      source,
      visitReason: visitReason ?? null,
      reportedByPhone: phoneHash,
    });
    res.status(201).json({ success: true, reportId: report.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Create error: ${message}` });
  }
});

export default router;
