export function contactMessageTemplate({
  name = "",
  email = "",
  subject = "",
  message = "",
}) {
  const year = new Date().getFullYear();

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[m],
    );

  const safeName = esc(name);
  const safeEmail = esc(email);
  const safeSubject = esc(subject);
  const safeMessage = esc(message).replace(/\n/g, "<br/>");

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
                <h2 style="margin:0 0 12px;font-size:18px;">New Contact Message</h2>

                <div style="font-size:14px;color:#111827;line-height:1.6;">
                  <p style="margin:0 0 10px;">
                    You received a new message from your website contact form.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,0.08);">
                        <div style="font-size:12px;color:#667085;margin-bottom:4px;">Name</div>
                        <div style="font-weight:600;">${safeName || "—"}</div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,0.08);">
                        <div style="font-size:12px;color:#667085;margin-bottom:4px;">Email</div>
                        <div style="font-weight:600;">${safeEmail || "—"}</div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,0.08);">
                        <div style="font-size:12px;color:#667085;margin-bottom:4px;">Subject</div>
                        <div style="font-weight:600;">${safeSubject || "—"}</div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:12px 0;border-top:1px solid rgba(0,0,0,0.08);">
                        <div style="font-size:12px;color:#667085;margin-bottom:6px;">Message</div>
                        <div style="background:#f6f8fb;border:1px solid rgba(0,0,0,0.08);
                                    padding:12px;border-radius:10px;color:#111827;">
                          ${safeMessage || "—"}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:14px 0 0;color:#667085;font-size:12px;">
                    Reply directly to this email to respond to the sender.
                  </p>
                </div>
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
