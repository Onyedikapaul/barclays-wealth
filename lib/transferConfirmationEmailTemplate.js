export function transferConfirmationEmailTemplate({
  name = "there",
  code = "123456",
  amount = "0.00",
  currency = "USD",
  beneficiaryName = "Recipient",
  beneficiaryBank = "Bank",
  beneficiaryAccountMasked = "**** **** ****",
  reference = "—",
  initiatedAt = "",
}) {
  const safeName = String(name || "there").replace(/[<>]/g, "");

  // ✅ allow 4 or 6 digits (strip non-digits, then take up to 6; if 5 digits, keep as-is)
  const digits = String(code || "")
    .replace(/\D/g, "")
    .slice(0, 6);
  const safeCode = digits.length >= 4 ? digits : "1234"; // fallback

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
  const safeInitiatedAt = String(initiatedAt || "").replace(/[<>]/g, "");

  const year = new Date().getFullYear();
  const codeLetterSpacing = safeCode.length === 4 ? "12px" : "10px";

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
                    Transfer Authorization Required
                  </div>
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:22px 20px;">
                <h2 style="margin:0 0 10px;font-size:18px;letter-spacing:-0.02em;color:#101828;">
                  Confirm your transfer, ${safeName}
                </h2>

                <p style="margin:0 0 14px;font-size:14px;color:#475467;line-height:1.6;">
                  You’re about to send <b>${safeCurrency} ${safeAmount}</b>.
                  For your security, please confirm this transfer using the code below.
                </p>

                <!-- Transfer details -->
                <div style="
                  margin:14px 0 18px;
                  padding:14px;
                  background:#ffffff;
                  border:1px solid rgba(0,0,0,0.10);
                  border-radius:14px;
                ">
                  <div style="font-size:12px;color:#667085;margin-bottom:10px;font-weight:700;">
                    Transfer details
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475467;">
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
                    ${
                      safeInitiatedAt
                        ? `<tr>
                            <td style="padding:6px 0;color:#667085;">Initiated</td>
                            <td style="padding:6px 0;text-align:right;color:#101828;font-weight:600;">${safeInitiatedAt}</td>
                          </tr>`
                        : ``
                    }
                  </table>
                </div>

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
                    Your confirmation code
                  </div>
                  <div style="font-size:32px;font-weight:800;letter-spacing:${codeLetterSpacing};color:#033d75;">
                    ${safeCode}
                  </div>
                  <div style="font-size:12px;color:#667085;margin-top:10px;">
                    This code will expire in <b>10 minutes</b>.
                  </div>
                </div>

                <div style="
                  margin:12px 0 0;
                  padding:12px 14px;
                  background:#fff7ed;
                  border:1px solid rgba(245,158,11,0.35);
                  border-radius:14px;
                  color:#92400e;
                  font-size:13px;
                  line-height:1.5;
                ">
                  <b>Didn’t initiate this transfer?</b> Please ignore this email and contact support immediately.
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
