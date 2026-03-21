export function adminSendEmailTemplate({ title = "", content = "" }) {
  const year = new Date().getFullYear();

  return `
  <div style="margin:0;padding:0;background:#f6f8fb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">

          <table width="100%" cellpadding="0" cellspacing="0"
            style="max-width:560px;background:#ffffff;border-radius:16px;
                   border:1px solid rgba(0,0,0,0.08);overflow:hidden;
                   font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">

            <!-- HEADER -->
            <tr>
              <td style="background:#033d75;padding:20px;">
                <div style="color:#ffffff;">
                  <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">
                    Next Gen Union
                  </div>
                  <div style="font-size:12px;opacity:0.85;margin-top:4px;">
                    Secure Banking Platform
                  </div>
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:22px 20px;">
                ${title ? `<h2 style="margin:0 0 12px;font-size:18px;">${title}</h2>` : ""}
                ${content}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:16px 20px;border-top:1px solid rgba(0,0,0,0.08);">
                <div style="font-size:12px;color:#667085;line-height:1.5;">
                  <p style="margin:0 0 6px;">
                    This email was sent by <b>Next Gen Union</b>.
                  </p>
                  <p style="margin:0;">
                    © ${year} Next Gen Union. All rights reserved.
                  </p>
                  <p style="margin:6px 0 0;">
                    Need help? Contact support.
                  </p>
                </div>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>
  `;
}
