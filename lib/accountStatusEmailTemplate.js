export const accountStatusEmailTemplate = ({
  name = "Customer",
  status = "suspended",
  reason = "",
  supportEmail = "info@next-gen-union.com",
}) => {
  const isSuspended = status === "suspended";
  const title = isSuspended ? "Account Suspended" : "Account Closed";

  const reasonBlock = reason
    ? `<div style="margin-top:12px;padding:12px;border:1px solid #eee;border-radius:10px;background:#fafafa">
         <div style="font-weight:700;margin-bottom:6px">Reason</div>
         <div style="color:#333;line-height:1.6">${escapeHtml(reason)}</div>
       </div>`
    : "";

  return `<!doctype html>
  <html>
    <body style="font-family:Arial,sans-serif;background:#f6f7fb;margin:0;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:14px;overflow:hidden">
        <div style="padding:18px 20px;background:#033d75;color:#fff">
          <div style="font-size:18px;font-weight:800">${title} | Next Gen Union</div>
        </div>

        <div style="padding:18px 20px;color:#111">
          <p style="margin:0 0 10px">Hi <b>${escapeHtml(name)}</b>,</p>

          <p style="margin:0 0 10px;line-height:1.6">
            Your Next Gen Union account has been <b>${escapeHtml(status)}</b>.
          </p>

          ${reasonBlock}

          <div style="margin-top:14px;padding-top:14px;border-top:1px solid #eee">
            <p style="margin:0;color:#444;line-height:1.6">
              If you believe this is a mistake, contact support at
              <a href="mailto:${supportEmail}">${supportEmail}</a>.
            </p>
          </div>
        </div>

        <div style="padding:14px 20px;background:#fafafa;border-top:1px solid #eee;color:#666;font-size:12px">
          © ${new Date().getFullYear()} Next Gen Union
        </div>
      </div>
    </body>
  </html>`;
};

// tiny helper to avoid HTML injection in emails
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
