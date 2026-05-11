import { NextResponse } from "next/server";
import { getRequestById, updateRequestStatus } from "@/lib/requests-store";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderBookingConfirmedEmail } from "@/lib/email/booking-confirmed-template";
import { upsertClientUser } from "@/lib/users-store";

export const runtime = "nodejs";

export async function POST(_req, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing request id." }, { status: 400 });
    }

    const existing = await getRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const updated = await updateRequestStatus(id, "Confirmed");
    const request = updated ?? existing;

    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME || "EventFlow";
    const adminTo = process.env.REQUESTS_RECIPIENT_EMAIL;
    const applicantEmail = request?.applicant?.email;
    const applicantName = request?.applicant?.name || "there";

    const loginUrl =
      process.env.PORTAL_LOGIN_URL ||
      (process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`
        : "http://localhost:3000/login");

    let portalAccess = null;
    if (applicantEmail) {
      const created = await upsertClientUser({ email: applicantEmail, name: applicantName });
      portalAccess = {
        username: created.user.username,
        email: created.user.email,
        password: created.password,
        loginUrl,
      };
    }

    const subject = `EventFlow booking confirmed — ${request.id}`;
    const html = renderBookingConfirmedEmail({
      request: {
        ...request,
        portalAccess,
      },
    });

    const email = {
      enabled: Boolean(apiKey && fromEmail),
      applicant: { to: applicantEmail || null, sent: false, error: null },
      admin: { to: adminTo || null, sent: false, error: null },
      reason: null,
    };

    if (!apiKey || !fromEmail) {
      email.reason = "Missing BREVO_API_KEY or BREVO_FROM_EMAIL in EventFlow/.env.local";
      return NextResponse.json({ request, email }, { status: 200 });
    }

    const jobs = [];
    if (applicantEmail) {
      jobs.push(
        sendBrevoEmail({
          apiKey,
          payload: {
            sender: { email: fromEmail, name: fromName },
            to: [{ email: applicantEmail, name: applicantName }],
            subject,
            htmlContent: html,
          },
        })
      );
    }
    if (adminTo) {
      jobs.push(
        sendBrevoEmail({
          apiKey,
          payload: {
            sender: { email: fromEmail, name: fromName },
            to: [{ email: adminTo }],
            subject: `[ADMIN] ${subject}`,
            htmlContent: html,
          },
        })
      );
    }

    const [applicantResult, adminResult] = await Promise.allSettled(jobs);
    if (applicantEmail && applicantResult) {
      email.applicant.sent = applicantResult.status === "fulfilled";
      email.applicant.error = applicantResult.status === "rejected" ? String(applicantResult.reason?.message || applicantResult.reason) : null;
    }
    if (adminTo && adminResult) {
      email.admin.sent = adminResult.status === "fulfilled";
      email.admin.error = adminResult.status === "rejected" ? String(adminResult.reason?.message || adminResult.reason) : null;
    }

    return NextResponse.json({ request, email }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Failed to confirm request." }, { status: 400 });
  }
}

