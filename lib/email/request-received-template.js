function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function line(label, value) {
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(value || "—");
  return `<tr>
    <td style="padding:8px 10px; color:#bac9cc; font-size:12px; border-top:1px solid rgba(255,255,255,0.06);">${safeLabel}</td>
    <td style="padding:8px 10px; color:#dae2fd; font-size:12px; border-top:1px solid rgba(255,255,255,0.06); text-align:right;">${safeValue}</td>
  </tr>`;
}

export function renderRequestReceivedEmail({ request }) {
  const safeName = escapeHtml(request?.applicant?.name || "there");
  const safeRequestId = escapeHtml(request?.id || "EF-0000");
  const safeStatus = escapeHtml(request?.status || "In Review");
  const safeEventName = escapeHtml(request?.event?.name || "Deployment Request");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EventFlow | Request Received</title>
    <style>
      body { margin: 0; padding: 0; background: #060e20; color: #dae2fd; font-family: Inter, Arial, sans-serif; }
      .wrap { width: 100%; padding: 18px 10px; }
      .container { max-width: 760px; margin: 0 auto; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: radial-gradient(1200px 700px at 10% -10%, rgba(0,229,255,0.11), transparent 45%), #0b1326; }
      .nav { padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(2,9,24,0.55); }
      .brand { color: #00e5ff; font-family: "Space Grotesk", Inter, Arial, sans-serif; font-weight: 900; font-size: 22px; letter-spacing: -0.02em; }
      .inner { padding: 22px; }
      .hero { border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(17,26,43,0.65); padding: 18px; }
      .pill { display: inline-block; border-radius: 999px; background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.24); color: #00e5ff; font-size: 10px; font-weight: 800; letter-spacing: 0.14em; padding: 6px 10px; text-transform: uppercase; }
      .h1 { margin: 12px 0 8px; font-family: "Space Grotesk", Inter, Arial, sans-serif; font-size: 46px; line-height: 1.05; letter-spacing: -0.02em; color: #e5ebff; }
      .p { margin: 0; color: #bac9cc; line-height: 1.6; font-size: 14px; }
      .cards { margin-top: 16px; }
      .card { border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(19,27,46,0.65); padding: 14px; margin-bottom: 10px; }
      .k { margin: 0 0 6px; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #bac9cc; font-weight: 700; }
      .v { margin: 0; font-size: 32px; line-height: 1.1; font-family: "Space Grotesk", Inter, Arial, sans-serif; font-weight: 800; color: #e6edff; }
      .id { border-left: 4px solid rgba(0,229,255,0.85); }
      .status { border-left: 4px solid rgba(208,188,255,0.85); color: #d0bcff; }
      .table { width: 100%; border-collapse: collapse; margin-top: 14px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
      .thead { background: rgba(255,255,255,0.04); }
      .foot { margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; color: rgba(148,163,184,0.9); font-size: 11px; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="container">
        <div class="nav"><span class="brand">EventFlow</span></div>
        <div class="inner">
          <div class="hero">
            <span class="pill">Intelligent Deployment</span>
            <h1 class="h1">We've Received Your Request</h1>
            <p class="p">Hello <span style="color:#00e5ff;font-weight:700;">${safeName}</span>, thank you for reaching out to EventFlow. We have successfully received your infrastructure deployment request.</p>
          </div>

          <div class="cards">
            <div class="card id">
              <p class="k">Request ID</p>
              <p class="v">${safeRequestId}</p>
              <p class="p" style="margin-top:8px;color:#00e5ff;">Verified System Entry</p>
            </div>
            <div class="card status">
              <p class="k">Current Status</p>
              <p class="v" style="font-size:34px;color:#d0bcff;">${safeStatus}</p>
              <p class="p" style="margin-top:8px;color:#d0bcff;">Estimate: 24 Hours</p>
            </div>
          </div>

          <table class="table" role="presentation">
            <thead class="thead">
              <tr>
                <td style="padding:10px 12px;color:#dae2fd;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Submission Summary</td>
                <td style="padding:10px 12px;color:#00e5ff;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-align:right;">${safeEventName}</td>
              </tr>
            </thead>
            <tbody>
              ${line("Event type", request?.event?.type)}
              ${line("Date", request?.event?.date)}
              ${line(
                "Time",
                request?.event?.startTime || request?.event?.endTime
                  ? `${request?.event?.startTime || "—"} – ${request?.event?.endTime || "—"}`
                  : ""
              )}
              ${line("Venue", request?.event?.venue)}
              ${line("Attendance", request?.event?.attendance)}
            </tbody>
          </table>

          <div class="foot">
            <strong style="color:#dae2fd;">Support resources:</strong> Help Center • Documentation • 24/7 Priority Support<br />
            © 2026 EVENTFLOW SYSTEMS INC. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

