function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fmtDate(value) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return escapeHtml(value);
    return escapeHtml(d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }));
  } catch {
    return escapeHtml(value);
  }
}

/**
 * Email-safe certificate HTML (no Tailwind/scripts).
 * @param {{ attendeeName: string; eventTitle: string; issueDate: string; verificationId: string }} input
 */
export function renderAttendanceQualifiedEmail(input) {
  const attendeeName = escapeHtml(input?.attendeeName || "Participant");
  const eventTitle = escapeHtml(input?.eventTitle || "Event");
  const issueDate = fmtDate(input?.issueDate || new Date().toISOString());
  const verificationId = escapeHtml(input?.verificationId || "EF-CERT-000000");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EventFlow | Certificate</title>
    <style>
      body { margin:0; padding:0; background:#0b1326; color:#111827; font-family: Inter, Arial, sans-serif; }
      table { border-collapse: collapse; }
      .wrap { width:100%; padding: 18px 10px; background:#0b1326; }
      .container { width:100%; max-width: 920px; margin: 0 auto; }
      .card { background:#ffffff; border-radius: 18px; overflow:hidden; border: 1px solid rgba(148,163,184,0.25); box-shadow: 0 30px 70px rgba(2,6,18,0.55); }
      .top { padding: 18px 22px; background: radial-gradient(900px 480px at 0% 0%, rgba(0,229,255,0.16), transparent 55%), #ffffff; border-bottom: 1px solid rgba(148,163,184,0.25); }
      .brand { font-family: "Space Grotesk", Inter, Arial, sans-serif; font-weight: 900; font-size: 18px; letter-spacing: -0.02em; color: #0b1326; }
      .sub { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #64748b; margin-top: 2px; }
      .body { padding: 26px 22px 24px; position: relative; }
      .frame { border: 2px solid rgba(148,163,184,0.35); padding: 10px; border-radius: 14px; }
      .inner { border: 1px solid rgba(148,163,184,0.35); border-radius: 12px; padding: 22px 20px; }
      .eyebrow { font-family: Georgia, "Times New Roman", serif; font-style: italic; color:#475569; font-size: 16px; }
      .name { margin: 10px 0 10px; font-family: Georgia, "Times New Roman", serif; font-size: 46px; line-height: 1.08; letter-spacing: -0.02em; font-weight: 700; color:#0b1326; }
      .rule { height:1px; background: rgba(148,163,184,0.45); margin: 10px 0 18px; }
      .title { font-family: Georgia, "Times New Roman", serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#0b1326; margin: 6px 0 0; }
      .desc { color:#64748b; font-size: 12px; font-style: italic; margin-top: 8px; }
      .meta { margin-top: 18px; }
      .metaLabel { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color:#64748b; }
      .sigWrap { margin-top: 18px; }
      .sig { font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 20px; color:#0b1326; opacity: 0.85; }
      .sigLine { height:1px; background: rgba(148,163,184,0.6); margin-top: 6px; }
      .sigName { margin-top: 8px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color:#0b1326; font-weight: 700; }
      .sigRole { font-size: 10px; color:#475569; font-style: italic; margin-top: 2px; }
      .side { padding: 0; width: 180px; background: linear-gradient(180deg, rgba(2,132,199,0.06), rgba(11,19,38,0.00)); border-left: 1px solid rgba(148,163,184,0.25); }
      .seal { width: 58px; height: 58px; border-radius: 999px; background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.35); margin: 16px auto 10px; }
      .verified { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color:#64748b; text-align:center; }
      .vid { margin: 14px 14px 0; padding: 10px 12px; border-radius: 12px; background: rgba(2,6,18,0.03); border: 1px solid rgba(148,163,184,0.25); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 10px; color:#334155; word-break: break-word; text-align:center; }
      .foot { padding: 14px 22px 18px; border-top: 1px solid rgba(148,163,184,0.25); background: #0b1326; color: rgba(226,232,240,0.85); font-size: 11px; line-height: 1.6; }
      .foot strong { color: #e2e8f0; }
      @media (max-width: 720px) { .side { display:none; } .name { font-size: 38px; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="container">
        <div class="card">
          <div class="top">
            <div class="brand">EventFlow</div>
            <div class="sub">Professional Certification</div>
          </div>
          <table role="presentation" width="100%">
            <tr>
              <td class="body" valign="top">
                <div class="frame">
                  <div class="inner">
                    <div class="eyebrow">This is to certify that</div>
                    <div class="name">${attendeeName}</div>
                    <div class="rule"></div>
                    <div class="eyebrow">has successfully completed</div>
                    <div class="title">${eventTitle}</div>
                    <div class="desc">Verified via Face ID check-in, Face ID check-out, and minimum duration attendance.</div>
                    <div class="meta">
                      <div class="metaLabel">Date of Issue: ${issueDate}</div>
                    </div>
                    <div class="sigWrap">
                      <div class="sig">Julian Chen</div>
                      <div class="sigLine"></div>
                      <div class="sigName">Julian Chen</div>
                      <div class="sigRole">Event Director, EventFlow Logistics</div>
                    </div>
                  </div>
                </div>
              </td>
              <td class="side" valign="top">
                <div class="seal"></div>
                <div class="verified">Verified</div>
                <div class="verified" style="margin-top:2px;">Certificate</div>
                <div class="vid">${verificationId}</div>
              </td>
            </tr>
          </table>
          <div class="foot">
            <strong>Verification:</strong> Keep this email for your records. Present the Verification ID if you need validation support.<br/>
            © 2026 EventFlow. Intelligent Precision in Motion.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

