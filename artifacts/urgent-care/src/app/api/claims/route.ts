import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUncachableResendClient } from "@/lib/resend";

const NOTIFY_ADDRESSES = [
  "jake.bronstein@dr-ubie.com",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinicId, contactName, contactEmail, contactPhone, role, message } = body;

    if (!clinicId || !contactName || !contactEmail || !contactPhone || !role) {
      return NextResponse.json({ error: "All required fields must be filled in." }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, city: true, state: true, stateSlug: true, citySlug: true, addressSlug: true, clinicSlug: true, isClaimed: true },
    });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found." }, { status: 404 });
    }
    if (clinic.isClaimed) {
      return NextResponse.json({ error: "This clinic has already been claimed." }, { status: 409 });
    }

    await prisma.claimRequest.create({
      data: { clinicId, contactName, contactEmail, contactPhone, role, message: message || null },
    });

    const clinicUrl = `https://urgent-care-deploy.replit.app/urgent-care/${clinic.stateSlug}/${clinic.citySlug}/${clinic.addressSlug}/${clinic.clinicSlug}`;
    const roleLabels: Record<string, string> = {
      owner: "Owner",
      manager: "Practice Manager",
      admin: "Administrative Staff",
      other: "Other",
    };

    const subject = `New clinic claim: ${clinic.name} (${clinic.city}, ${clinic.state})`;
    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
  <h2 style="color:#1a56db;margin-bottom:4px">New Clinic Claim Request</h2>
  <p style="margin-top:0;color:#6b7280;font-size:14px">Submitted via urgentcare.ubiehealth.com</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600;width:140px">Clinic</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><a href="${clinicUrl}" style="color:#1a56db">${clinic.name}</a><br/><span style="color:#6b7280">${clinic.city}, ${clinic.state}</span></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">Name</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${contactName}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">Email</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><a href="mailto:${contactEmail}" style="color:#1a56db">${contactEmail}</a></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">Phone</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${contactPhone}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600">Role</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${roleLabels[role] ?? role}</td></tr>
    ${message ? `<tr><td style="padding:8px 0;font-weight:600;vertical-align:top">Message</td>
        <td style="padding:8px 0">${message}</td></tr>` : ""}
  </table>

  <div style="margin-top:24px;padding:12px 16px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1e40af">
    Status: <strong>PENDING</strong> — review and approve in the database, or reply directly to the submitter.
  </div>
</div>`;

    try {
      const { client, fromEmail } = await getUncachableResendClient();
      await client.emails.send({
        from: `UbieHealth Claims <${fromEmail}>`,
        to: NOTIFY_ADDRESSES,
        subject,
        html,
        replyTo: contactEmail,
      });
    } catch (emailErr) {
      console.error("Claim email notification failed (claim still saved):", emailErr);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
