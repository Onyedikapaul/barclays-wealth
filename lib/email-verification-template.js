export function verificationEmailTemplate({ name = "there", code = "123456" }) {
  const safeName = String(name || "there").replace(/[<>]/g, "");
  const safeCode = String(code || "")
    .replace(/\D/g, "")
    .slice(0, 6);

  const year = new Date().getFullYear();

  return `
  <div style="margin:0;padding:0;background:#f6f8fb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 14px;">

          <!-- Container -->
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
                    Secure Account Verification
                  </div>
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:22px 20px;">
                <h2 style="margin:0 0 10px;font-size:18px;letter-spacing:-0.02em;color:#101828;">
                  Welcome, ${safeName}
                </h2>

                <p style="margin:0 0 14px;font-size:14px;color:#475467;line-height:1.6;">
                  Thank you for creating an account with <b>Next Gen Union</b>.
                  To complete your registration and keep your account secure,
                  please verify your email address using the code below.
                </p>

                <!-- Code box -->
                <div style="
                  margin:18px 0;
                  padding:18px;
                  background:#f6f8fb;
                  border:1px solid rgba(0,0,0,0.10);
                  border-radius:14px;
                  text-align:center;
                ">
                  <div style="font-size:12px;color:#667085;margin-bottom:8px;">
                    Your verification code
                  </div>
                  <div style="font-size:32px;font-weight:800;letter-spacing:10px;color:#033d75;">
                    ${safeCode}
                  </div>
                  <div style="font-size:12px;color:#667085;margin-top:10px;">
                    This code will expire in <b>10 minutes</b>.
                  </div>
                </div>

                <p style="margin:0;font-size:13px;color:#667085;line-height:1.6;">
                  If you did not request this verification, you can safely ignore
                  this email. No action is required.
                </p>
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
          <!-- /Container -->

        </td>
      </tr>
    </table>
  </div>
  `;
}
