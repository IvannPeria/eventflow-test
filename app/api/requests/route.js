import { NextResponse } from "next/server";
import { createRequest, listRequests } from "@/lib/requests-store";
import { renderRequestReceivedEmail } from "@/lib/email/request-received-template";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { saveHiringDetailsSubmission } from "@/lib/hiring-details-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const requests = await listRequests();
    return NextResponse.json({ requests });
  } catch (e) {
    console.error("GET /api/requests failed:", e);
    return NextResponse.json(
      { requests: [], error: e?.message || "Failed to load requests." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const form = await req.json();
    const persisted = await saveHiringDetailsSubmission(form);
    const created = await createRequest(form);

    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME || "EventFlow";
    const adminTo = process.env.REQUESTS_RECIPIENT_EMAIL;

    const applicantEmail = created?.applicant?.email;
    const applicantName = created?.applicant?.name || "there";

    const html = renderRequestReceivedEmail({ request: created });

    const subject = `EventFlow request received — ${created.id}`;

    const email = {
      enabled: Boolean(apiKey && fromEmail),
      applicant: { to: applicantEmail || null, sent: false, error: null },
      admin: { to: adminTo || null, sent: false, error: null },
      reason: null,
    };

    const sendJobs = [];

    const keyLooksPlaceholder = typeof apiKey === "string" && apiKey.includes("REPLACE_WITH_ROTATED_KEY");
    if (!apiKey || !fromEmail) {
      email.reason = "Missing BREVO_API_KEY or BREVO_FROM_EMAIL in EventFlow/.env.local";
    } else if (keyLooksPlaceholder) {
      email.reason = "BREVO_API_KEY is still set to placeholder. Replace with your real Brevo key and restart dev server.";
    }

    if (apiKey && fromEmail && applicantEmail) {
      sendJobs.push(
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

    if (apiKey && fromEmail && adminTo) {
      sendJobs.push(
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

    if (sendJobs.length) {
      const results = await Promise.allSettled(sendJobs);
      // We don't know which job is which based on array alone; infer by presence of applicant/admin targets
      // Order is applicant first then admin second based on pushes above.
      const [applicantResult, adminResult] = results;
      if (applicantEmail && applicantResult) {
        email.applicant.sent = applicantResult.status === "fulfilled";
        email.applicant.error = applicantResult.status === "rejected" ? String(applicantResult.reason?.message || applicantResult.reason) : null;
      }
      if (adminTo && adminResult) {
        email.admin.sent = adminResult.status === "fulfilled";
        email.admin.error = adminResult.status === "rejected" ? String(adminResult.reason?.message || adminResult.reason) : null;
      }
    }

    return NextResponse.json(
      {
        request: created,
        database: {
          event: persisted.event,
          client: persisted.client,
          activation: persisted.activation,
        },
        email,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/requests failed:", e);
    return NextResponse.json(
      {
        error: e?.message || "Failed to submit request.",
      },
      { status: 400 }
    );
  }
}

