export function transferSuccessEmailTemplate({
  name = "there",
  amount = "0.00",
  currency = "USD",
  beneficiaryName = "Recipient",
  beneficiaryBank = "Bank",
  beneficiaryAccountMasked = "**** **** ****",
  reference = "—",
  transactionId = "—",
  completedAt = "",
  status = "Successful",
}) {
  const safeName = String(name || "there").replace(/[<>]/g, "");
  const safeAmount = String(amount || "0.00").replace(/[<>]/g, "");
  const safeCurrency = String(currency || "USD").replace(/[<>]/g, "");

  const safeBeneficiaryName = String(beneficiaryName || "Recipient").replace(
    /[<>]/g,
    "",
  );
  const safeBeneficiaryBank = String(beneficiaryBank || "Bank").replace(
    /[<>]/g,
    "",
  );
  const safeBeneficiaryAccountMasked = String(
    beneficiaryAccountMasked || "****",
  ).replace(/[<>]/g, "");

  const safeReference = String(reference || "—").replace(/[<>]/g, "");
  const safeTransactionId = String(transactionId || "—").replace(/[<>]/g, "");
  const safeCompletedAt = String(completedAt || "").replace(/[<>]/g, "");
  const safeStatus = String(status || "Successful").replace(/[<>]/g, "");

  const year = new Date().getFullYear();

  return `
  <div style="margin:0;padding:0;background:#f6f8fb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 14px;">

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
                    Transfer Receipt
                  </div>
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:22px 20px;">
                <h2 style="margin:0 0 10px;font-size:18px;letter-spacing:-0.02em;color:#101828;">
                  Transfer ${safeStatus}
                </h2>

                <p style="margin:0 0 14px;font-size:14px;color:#475467;line-height:1.6;">
                  Hello ${safeName}, your transfer of <b>${safeCurrency} ${safeAmount}</b> has been completed.
                </p>

                <!-- Status pill -->
                <div style="margin:12px 0 18px;">
                  <span style="
                    display:inline-block;
                    padding:6px 10px;
                    border-radius:999px;
                    background:#ecfdf3;
                    border:1px solid rgba(16,185,129,0.35);
                    color:#027a48;
                    font-size:12px;
                    font-weight:700;
                  ">
                    ${safeStatus}
                  </span>
                </div>

                <!-- Receipt details -->
                <div style="
                  margin:14px 0 6px;
                  padding:14px;
                  background:#ffffff;
                  border:1px solid rgba(0,0,0,0.10);
                  border-radius:14px;
                ">
                  <div style="font-size:12px;color:#667085;margin-bottom:10px;font-weight:700;">
                    Transaction details
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475467;">
                    <tr>
                      <td style="padding:6px 0;color:#667085;">Amount</td>
                      <td style="padding:6px 0;text-align:right;color:#101828;font-weight:700;">${safeCurrency} ${safeAmount}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#667085;">Beneficiary</td>
                      <td style="padding:6px 0;text-align:right;color:#101828;font-weight:600;">${safeBeneficiaryName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#667085;">Bank</td>
                      <td style="padding:6px 0;text-align:right;color:#101828;font-weight:600;">${safeBeneficiaryBank}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#667085;">Account</td>
                      <td style="padding:6px 0;text-align:right;color:#101828;font-weight:600;">${safeBeneficiaryAccountMasked}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#667085;">Reference</td>
                      <td style="padding:6px 0;text-align:right;color:#101828;font-weight:600;">${safeReference}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#667085;">Transaction ID</td>
                      <td style="padding:6px 0;text-align:right;color:#101828;font-weight:600;">${safeTransactionId}</td>
                    </tr>
                    ${
                      safeCompletedAt
                        ? `<tr>
                            <td style="padding:6px 0;color:#667085;">Completed</td>
                            <td style="padding:6px 0;text-align:right;color:#101828;font-weight:600;">${safeCompletedAt}</td>
                          </tr>`
                        : ``
                    }
                  </table>
                </div>

                <p style="margin:14px 0 0;font-size:12px;color:#667085;line-height:1.6;">
                  If you don’t recognize this transaction, please contact support immediately.
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

        </td>
      </tr>
    </table>
  </div>
  `;
}
