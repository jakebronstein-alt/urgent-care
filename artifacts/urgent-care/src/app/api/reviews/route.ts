import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinicId, phone, rating, body: reviewBody } = body;

    if (!clinicId || !phone || !rating || !reviewBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const digits = String(phone).replace(/\D/g, "");
    if (digits.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Verify the clinic exists
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Find or create a user keyed by phone number
    const syntheticEmail = `${digits}@phone.ubiehealth`;
    const user = await prisma.user.upsert({
      where: { email: syntheticEmail },
      update: {},
      create: {
        email: syntheticEmail,
        name: "Patient",
      },
    });

    // Create the review (unique constraint on clinicId + userId prevents duplicates)
    try {
      await prisma.review.create({
        data: {
          clinicId,
          userId: user.id,
          rating: ratingNum,
          body: reviewBody,
        },
      });
    } catch {
      // Unique constraint violation — already reviewed
      return NextResponse.json(
        { error: "You've already reviewed this clinic." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
