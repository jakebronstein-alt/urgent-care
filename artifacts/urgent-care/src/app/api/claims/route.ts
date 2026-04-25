import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinicId, contactName, contactEmail, contactPhone, role, message } = body;

    if (!clinicId || !contactName || !contactEmail || !contactPhone || !role) {
      return NextResponse.json({ error: "All required fields must be filled in." }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { id: true, isClaimed: true } });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found." }, { status: 404 });
    }
    if (clinic.isClaimed) {
      return NextResponse.json({ error: "This clinic has already been claimed." }, { status: 409 });
    }

    await prisma.claimRequest.create({
      data: { clinicId, contactName, contactEmail, contactPhone, role, message: message || null },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
