import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Simple deterministic hash — no external imports
function hashPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // FNV-1a 32-bit — fast, built-in, no imports needed
  let hash = 2166136261;
  for (let i = 0; i < digits.length; i++) {
    hash ^= digits.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { clinicId, peopleCount, source, phone, visitReason } = body as {
    clinicId?: string;
    peopleCount?: number;
    source?: string;
    phone?: string;
    visitReason?: string;
  };

  if (!clinicId || typeof peopleCount !== "number" || peopleCount < 0) {
    return NextResponse.json({ error: "Missing or invalid fields (clinicId / peopleCount)" }, { status: 400 });
  }

  const validSources = ["CROWDSOURCED_WEB", "CLINIC_DASHBOARD", "SMS"];
  if (!source || !validSources.includes(source)) {
    return NextResponse.json({ error: `Invalid source: "${source}"` }, { status: 400 });
  }

  try {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { id: true } });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[wait-times] clinic lookup failed:", msg);
    return NextResponse.json({ error: `DB lookup error: ${msg}` }, { status: 500 });
  }

  // Rate limiting
  let phoneHash: string | null = null;
  if (phone) {
    phoneHash = hashPhone(phone);
    try {
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
      const recentCount = await prisma.waitingRoomReport.count({
        where: { reportedByPhone: phoneHash, createdAt: { gte: windowStart } },
      });
      if (recentCount >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "rate_limited", message: "You've submitted too many reports recently. Please try again in 30 minutes." },
          { status: 429 }
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[wait-times] rate limit check failed:", msg);
      return NextResponse.json({ error: `Rate limit check error: ${msg}` }, { status: 500 });
    }
  }

  // Create report
  try {
    const report = await prisma.waitingRoomReport.create({
      data: {
        clinicId,
        peopleCount,
        source: source as "CROWDSOURCED_WEB" | "CLINIC_DASHBOARD" | "SMS",
        visitReason: visitReason ?? null,
        reportedByPhone: phoneHash,
      },
    });
    return NextResponse.json({ success: true, reportId: report.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[wait-times] report create failed:", msg);
    return NextResponse.json({ error: `Create error: ${msg}` }, { status: 500 });
  }
}
