function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderBookingConfirmedEmail({ request }) {
  const name = escapeHtml(request?.applicant?.name || "there");
  const eventName = escapeHtml(request?.event?.name || "your event");
  const requestId = escapeHtml(request?.id || "EF-0000");

  const venue = escapeHtml(request?.event?.venue || "—");
  const date = escapeHtml(request?.event?.date || "—");
  const time = request?.event?.startTime || request?.event?.endTime
    ? escapeHtml(`${request?.event?.startTime || "—"} – ${request?.event?.endTime || "—"}`)
    : "—";

  const status = escapeHtml(request?.status || "Confirmed");
  const attendance = escapeHtml(request?.event?.attendance || "—");

  const portal = request?.portalAccess;
  const portalEmail = escapeHtml(portal?.email || "");
  const portalUsername = escapeHtml(portal?.username || "");
  const portalPassword = escapeHtml(portal?.password || "");
  const portalUrl = escapeHtml(portal?.loginUrl || "");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>EventFlow | Booking Confirmed</title>
    <style>
      body { margin:0; padding:0; background:#070f21; color:#dae2fd; font-family: Inter, Arial, sans-serif; }
      table { border-collapse: collapse; }
      .wrap { width:100%; padding: 20px 12px; background:#070f21; }
      .container { width:100%; max-width: 720px; margin: 0 auto; }
      .brand { text-align:center; font-family: "Space Grotesk", Inter, Arial, sans-serif; font-weight:900; letter-spacing:-0.02em; color:#00e5ff; font-size: 22px; padding: 8px 0 14px; }
      .shell { border-radius: 16px; overflow: hidden; border: 1px solid #2d3b57; background:#0d1730; box-shadow: 0 22px 50px rgba(2,6,18,0.45); }
      .inner { padding: 28px 22px; text-align:center; background: linear-gradient(180deg, #10203e 0%, #0d1730 100%); }
      .badgeWrap { width: 76px; height: 76px; margin: 0 auto; border-radius: 999px; border:1px solid #1f7690; background:#103244; box-shadow: 0 0 18px rgba(0,229,255,0.22); }
      .badgeIcon { width: 36px; height: 36px; margin: 19px auto 0; border-radius: 10px; background:#0f4d63; border: 1px solid #22bfd8; }
      .cap { margin-top: 12px; color:#00daf3; font-size: 11px; font-weight: 800; letter-spacing: 0.20em; text-transform: uppercase; }
      .h1 { margin: 16px 0 8px; font-family: "Space Grotesk", Inter, Arial, sans-serif; font-size: 38px; line-height: 1.1; letter-spacing:-0.01em; color:#c3f5ff; }
      .p { margin: 0; color:#c2d0e6; font-size: 15px; line-height: 1.6; }
      .pill { display:inline-block; margin-top: 14px; padding: 6px 11px; border-radius: 999px; background:#0f3f52; border: 1px solid #1b6d86; color:#00e5ff; font-size: 11px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase; }
      .grid { width:100%; margin-top: 18px; }
      .box { width:100%; text-align:left; border-radius: 12px; background:#18253f; border: 1px solid #2b3955; padding: 14px; }
      .box + .box { margin-top: 10px; }
      .k { margin:0 0 6px; color:#98a8c2; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
      .v { margin:0; color:#e1e9ff; font-family: "Space Grotesk", Inter, Arial, sans-serif; font-size: 18px; font-weight: 700; }
      .heroImage { width:100%; height: 190px; border-radius: 12px; overflow: hidden; border: 1px solid #2a3752; margin-top: 14px; background:#111a30; }
      .divider { height:1px; margin: 16px 0 12px; background: linear-gradient(90deg, transparent 0%, #2d3b57 20%, #2d3b57 80%, transparent 100%); }
      .meta { margin-top: 12px; border: 1px solid #2a3650; border-radius: 10px; background: #111d37; padding: 10px 12px; text-align: left; }
      .metaRow { font-size: 12px; line-height: 1.6; color: #9fb0cb; }
      .metaRow strong { color: #d8e3fb; font-weight: 700; }
      .foot { padding: 16px 22px 18px; border-top: 1px solid #263450; background:#0c1530; text-align:center; }
      .fine { margin: 0; color:#8ea0be; font-size: 11px; line-height: 1.6; }
      .cta { display:inline-block; margin-top: 14px; padding: 12px 16px; border-radius: 12px; background: linear-gradient(90deg, #00e5ff 0%, #4b7cff 100%); color:#061022; text-decoration:none; font-weight: 900; letter-spacing:0.08em; text-transform:uppercase; font-size: 12px; }
      .creds { margin-top: 16px; border-radius: 14px; border: 1px solid #2b3955; background: #0f1a34; text-align:left; padding: 14px; }
      .row { display:flex; justify-content:space-between; gap: 12px; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.06); }
      .row:first-child { border-top: 0; padding-top: 0; }
      .row:last-child { padding-bottom: 0; }
      .row .k { margin:0; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color:#98a8c2; }
      .row .val { margin:0; font-family: "Space Grotesk", Inter, Arial, sans-serif; font-weight: 800; color:#e1e9ff; word-break: break-word; text-align:right; }
      @media (min-width: 640px) {
        .h1 { font-size: 42px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="container">
        <div class="brand">EventFlow</div>
        <div class="shell">
          <div class="inner">
            <div class="badgeWrap" aria-hidden="true">
              <div class="badgeIcon"></div>
            </div>
            <div class="cap">Deployment Confirmed</div>
            <h1 class="h1">Hello ${name}</h1>
            <p class="p">
              Your deployment request has been confirmed. Our team is preparing on-site logistics and system activation for <strong style="color:#dae2fd;">${eventName}</strong>.
            </p>

            <span class="pill">Request ${requestId} • ${status}</span>

            <div class="grid">
              <div class="box">
                <p class="k">Event Details</p>
                <p class="v">${eventName}</p>
                <p class="p" style="margin-top:10px;">${venue}</p>
              </div>
              <div class="box">
                <p class="k">Deployment Status</p>
                <p class="v" style="color:#00e5ff;">Confirmed</p>
                <p class="p" style="margin-top:10px;">Schedule: ${date} • ${time}</p>
              </div>
              <div class="box">
                <p class="k">Schedule</p>
                <p class="v">${date}</p>
                <p class="p" style="margin-top:10px;">${time}</p>
              </div>
              <div class="box">
                <p class="k">Attendance</p>
                <p class="v">${attendance}</p>
                <p class="p" style="margin-top:10px;">Estimated attendees</p>
              </div>
            </div>

            <div class="heroImage">
              <img alt="Event Setup" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq1mz0FFfTi8r3jFkFj9Nt2DgbInpzEq0RwowqU9tvVVSO0Hygst7WKXN7VnTlM5GilsGDedV6iELUNa2vAuBm04gKjBtN5U2k9D9qlCc8-pUYMctF9Q2GZHiBH9z28qw3I6hXSUPUXeEOWrXw9f0wkC6-Fpf42Kp38FmcZ-3qkWnFmxwEbZJ6lryQmrgTAfybWmGlJTZnssXnQxTJ4gmrdc6cLh6Y7OoGfQmLmQt1ci9zNmtC_muN0cPeZRTORH_MHex0hIvixA" style="display:block;width:100%;height:100%;object-fit:cover;opacity:0.68;" />
            </div>

            <div class="meta">
              <div class="metaRow"><strong>Request ID:</strong> ${requestId}</div>
              <div class="metaRow"><strong>Status:</strong> ${status}</div>
            </div>
            ${
              portal && portalUrl && portalPassword
                ? `<div class="divider"></div>
            <p class="p" style="font-size:13px; margin-top:0;">
              Your client dashboard is ready. Use the credentials below to log in.
            </p>
            <div class="creds">
              <div class="row">
                <p class="k">Username</p>
                <p class="val">${portalUsername || portalEmail}</p>
              </div>
              <div class="row">
                <p class="k">Email</p>
                <p class="val">${portalEmail}</p>
              </div>
              <div class="row">
                <p class="k">Temporary password</p>
                <p class="val">${portalPassword}</p>
              </div>
            </div>
            <div style="text-align:center;">
              <a class="cta" href="${portalUrl}">Open login portal</a>
            </div>`
                : ""
            }
            <div class="divider"></div>
            <p class="p" style="font-size:13px;">Our operations team will contact you shortly with final deployment coordination details.</p>
          </div>
          <div class="foot">
            <p class="fine">EventFlow Global Logistics Division</p>
            <p class="fine">Support: support@eventflow.io</p>
            <p class="fine" style="margin-top:8px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.8;">© 2026 EventFlow. Intelligent Precision in Motion.</p>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

