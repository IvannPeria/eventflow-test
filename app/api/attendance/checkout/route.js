import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderAttendanceQualifiedEmail } from "@/lib/email/attendance-qualified-template";

export const runtime = "nodejs";

function minutesBetween(a, b) {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return null;
  return Math.max(0, Math.round((t2 - t1) / 60000));
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const attendeeEmail = String(payload?.attendeeEmail || "").trim();
    const attendeeName = String(payload?.attendeeName || "").trim();
    const eventTitle = String(payload?.eventTitle || "").trim();
    const eventStart = payload?.eventStart;
    const eventEnd = payload?.eventEnd;
    const checkInAt = payload?.checkInAt;
    const checkOutAt = payload?.checkOutAt;

    if (!attendeeEmail || !attendeeName || !eventTitle) {
      return NextResponse.json({ ok: false, error: "Missing attendee or event data." }, { status: 400 });
    }

    // Qualification criteria (ignore participation + task completion):
    // - Face verified at check-in  (caller only hits this endpoint after successful check-out approval)
    // - Face verified at check-out (caller only hits this endpoint after successful check-out approval)
    // - Stayed at least 80% of event duration (when event window is available)
    const attendedMin = minutesBetween(checkInAt, checkOutAt);
    const eventMin = minutesBetween(eventStart, eventEnd);
    const durationOk = attendedMin !== null && eventMin !== null ? attendedMin >= Math.ceil(eventMin * 0.8) : true;
    const qualified = Boolean(durationOk);

    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME || "EventFlow";

    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        { ok: true, qualified, email: { enabled: false, reason: "Missing BREVO_API_KEY or BREVO_FROM_EMAIL" } },
        { status: 200 }
      );
    }

    if (!qualified) {
      return NextResponse.json({ ok: true, qualified, email: { enabled: true, sent: false, reason: "Not qualified." } }, { status: 200 });
    }

    const verificationId = `EF-CERT-${crypto.randomInt(100000, 999999)}`;
    const subject = `EventFlow certificate — ${eventTitle}`;
    const html = renderAttendanceQualifiedEmail({
      attendeeName,
      eventTitle,
      issueDate: new Date().toISOString(),
      verificationId,
    });

    await sendBrevoEmail({
      apiKey,
      payload: {
        sender: { email: fromEmail, name: fromName },
        to: [{ email: attendeeEmail, name: attendeeName }],
        subject,
        htmlContent: html,
      },
    });

    return NextResponse.json({ ok: true, qualified, verificationId, email: { enabled: true, sent: true } }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to process checkout." }, { status: 400 });
  }
}

