import { Router, type IRouter } from "express";
import { upsertFollowUpRequest } from "../lib/db-queries";

const router: IRouter = Router();

router.post("/follow-up", async (req, res) => {
  const { reportId, clinicId, phone, visitReason, optedIn } = req.body as {
    reportId?: string;
    clinicId?: string;
    phone?: string;
    visitReason?: string;
    optedIn?: boolean;
  };

  if (!reportId || !clinicId || !phone) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 10) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  try {
    await upsertFollowUpRequest({
      reportId,
      clinicId,
      phone,
      visitReason: visitReason ?? null,
      optedIn: optedIn === true,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Server error: ${message}` });
  }
});

export default router;
