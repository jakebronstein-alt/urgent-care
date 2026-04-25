import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, clinicId, phone, visitReason, optedIn } = body;

    if (!reportId || !clinicId || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.followUpRequest.upsert({
      where: { reportId },
      update: { visitReason: visitReason ?? null, optedIn: optedIn === true },
      create: {
        reportId,
        clinicId,
        phone,
        visitReason: visitReason ?? null,
        optedIn: optedIn === true,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
