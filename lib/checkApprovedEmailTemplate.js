export function checkApprovedEmailTemplate({
  name = "there",
  amount = 0,
  currency = "USD",
  reference = "",
  accountNumber = "",
}) {
  const safeName = String(name || "there")
    .replace(/[<>]/g, "")
    .trim();

  const safeCurrency = String(currency || "USD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 5);

  const safeRef = String(reference || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);

  const safeAccount = String(accountNumber || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 40);

  const safeAmountNum = Number(amount || 0);
  const safeAmount = Number.isFinite(safeAmountNum)
    ? safeAmountNum.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

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
                    Check Deposit Notification
                  </div>
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:22px 20px;">
                <h2 style="margin:0 0 10px;font-size:18px;letter-spacing:-0.02em;color:#101828;">
                  Hello, ${safeName}
                </h2>

                <p style="margin:0 0 14px;font-size:14px;color:#475467;line-height:1.6;">
                  Your check deposit has been <b>approved</b> and credited to your account.
                </p>

                <!-- Amount box -->
                <div style="
                  margin:18px 0 14px;
                  padding:18px;
                  background:#f6f8fb;
                  border:1px solid rgba(0,0,0,0.10);
                  border-radius:14px;
                ">
                  <div style="font-size:12px;color:#667085;margin-bottom:8px;">
                    Amount credited
                  </div>

                  <div style="font-size:28px;font-weight:800;letter-spacing:-0.02em;color:#033d75;">
                    ${safeAmount} ${safeCurrency}
                  </div>

                  <div style="margin-top:12px;font-size:13px;color:#475467;line-height:1.6;">
                    <div style="margin:0 0 6px;">
                      <span style="color:#667085;">Account:</span>
                      <b>${safeAccount || "—"}</b>
                    </div>

                    <div style="margin:0;">
                      <span style="color:#667085;">Reference:</span>
                      <b>${safeRef || "—"}</b>
                    </div>
                  </div>
                </div>

                <p style="margin:0;font-size:13px;color:#667085;line-height:1.6;">
                  If you did not initiate this deposit, please contact support immediately.
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
