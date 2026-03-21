export function rejectionEmailTemplate({
  name = "there",
  amount = 0,
  currency = "USD",
  reference = "",
  reason = "",
  supportEmail = "info@next-gen-union.com",
}) {
  const safeName = String(name || "there").replace(/[<>]/g, "");

  const safeCurrency = String(currency || "USD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const safeRef = String(reference || "")
    .replace(/[<>]/g, "")
    .trim();
  const safeReason = String(reason || "")
    .replace(/[<>]/g, "")
    .trim();

  const numAmount = Number(amount || 0);
  const safeAmount = Number.isFinite(numAmount)
    ? numAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const safeSupport = String(supportEmail || "info@atlas-heritage.pro").replace(
    /[<>]/g,
    "",
  );

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
                    Check Deposit Update
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
                  We reviewed your recent check deposit submission and we’re unable to process it at this time.
                  The deposit has been marked as <b>Rejected</b>.
                </p>

                <!-- Summary box -->
                <div style="
                  margin:18px 0;
                  padding:18px;
                  background:#f6f8fb;
                  border:1px solid rgba(0,0,0,0.10);
                  border-radius:14px;
                ">
                  <div style="font-size:12px;color:#667085;margin-bottom:10px;">
                    Deposit details
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#344054;">
                    <tr>
                      <td style="padding:6px 0;opacity:0.75;">Amount</td>
                      <td style="padding:6px 0;text-align:right;font-weight:700;color:#101828;">
                        ${safeAmount} ${safeCurrency}
                      </td>
                    </tr>

                    ${
                      safeRef
                        ? `<tr>
                            <td style="padding:6px 0;opacity:0.75;">Reference</td>
                            <td style="padding:6px 0;text-align:right;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
                              ${safeRef}
                            </td>
                          </tr>`
                        : ""
                    }

                    <tr>
                      <td style="padding:6px 0;opacity:0.75;">Status</td>
                      <td style="padding:6px 0;text-align:right;">
                        <span style="
                          display:inline-block;
                          padding:4px 10px;
                          border-radius:999px;
                          border:1px solid rgba(220,53,69,0.35);
                          background:rgba(220,53,69,0.10);
                          color:#b42318;
                          font-weight:700;
                          font-size:12px;
                        ">Rejected</span>
                      </td>
                    </tr>
                  </table>

                  ${
                    safeReason
                      ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.06);">
                          <div style="font-size:12px;color:#667085;margin-bottom:6px;">
                            Reason (summary)
                          </div>
                          <div style="font-size:13px;color:#344054;line-height:1.6;">
                            ${safeReason}
                          </div>
                        </div>`
                      : `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.06);">
                          <div style="font-size:13px;color:#344054;line-height:1.6;">
                            If you believe this was a mistake, please contact support and we’ll help you resolve it.
                          </div>
                        </div>`
                  }
                </div>

                <p style="margin:0;font-size:13px;color:#667085;line-height:1.6;">
                  You can submit a new check deposit at any time after correcting the issue.
                </p>

                <!-- Support CTA -->
                <div style="margin-top:16px;">
                  <a href="mailto:${safeSupport}" style="
                    display:inline-block;
                    text-decoration:none;
                    padding:10px 14px;
                    border-radius:12px;
                    border:1px solid rgba(0,0,0,0.12);
                    background:#ffffff;
                    color:#033d75;
                    font-weight:700;
                    font-size:13px;
                  ">Contact Support</a>
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
                    Need help? Email <b>${safeSupport}</b>.
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
