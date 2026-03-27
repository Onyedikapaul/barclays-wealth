// import bcrypt from "bcrypt";
// import UserModel from "../models/UserModel.js";
// import wireTransferHistoryModel from "../models/wireTransferHistoryModel.js";
// import resend from "../lib/resend.js";

// function makeRef(prefix = "WIRE") {
//   return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
// }

// function gen6() {
//   return String(Math.floor(100000 + Math.random() * 900000));
// }

// // ─── SEND OTP ────────────────────────────────────────────────────────────────
// export const sendWireOtp = async (req, res) => {
//   try {
//     const user = await UserModel.findById(req.user._id);
//     if (!user)
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });

//     const otp = gen6();
//     const otpHash = await bcrypt.hash(otp, 10);
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

//     user.wireOtpHash = otpHash;
//     user.wireOtpExpiresAt = otpExpiry;
//     await user.save();

//     const name =
//       `${user.firstname || ""} ${user.lastname || ""}`.trim() || "Customer";

//     const html = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Transfer Verification</title>
//       </head>
//       <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
//         <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
//           <tr>
//             <td align="center">
//               <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
//                 <!-- Header -->
//                 <tr>
//                   <td style="background:#033d75;padding:28px 32px 22px;text-align:center;">
//                     <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Barclays Wealth</div>
//                     <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px;">Secure Transfer Verification</div>
//                   </td>
//                 </tr>
//                 <!-- Body -->
//                 <tr>
//                   <td style="padding:32px;">
//                     <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0f1a2e;">Hello, ${name}</p>
//                     <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
//                       You requested to authorize a cross-border wire transfer. Use the verification code below to complete the process.
//                     </p>
//                     <!-- OTP Box -->
//                     <div style="background:#f8fafc;border:2px dashed #c7d9f5;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
//                       <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:10px;">Your Verification Code</div>
//                       <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#033d75;">${otp}</div>
//                       <div style="font-size:12px;color:#94a3b8;margin-top:10px;">Expires in <strong>10 minutes</strong></div>
//                     </div>
//                     <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;line-height:1.5;">
//                       If you did not initiate this transfer, please ignore this email and contact support immediately.
//                     </p>
//                     <p style="margin:0;font-size:13px;color:#94a3b8;">
//                       Do not share this code with anyone.
//                     </p>
//                   </td>
//                 </tr>
//                 <!-- Footer -->
//                 <tr>
//                   <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px 32px;text-align:center;">
//                     <div style="font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Barclays Wealth. All rights reserved.</div>
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//         </table>
//       </body>
//       </html>
//     `;

//     const { error } = await resend.emails.send({
//       from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
//       to: user.email,
//       subject: "Your Wire Transfer Verification Code",
//       html,
//     });

//     if (error) {
//       console.error("Wire OTP email error:", error);
//       return res
//         .status(500)
//         .json({
//           success: false,
//           message: "Failed to send verification email. Please try again.",
//         });
//     }

//     return res.json({
//       success: true,
//       message: "Verification code sent to your email.",
//     });
//   } catch (err) {
//     console.error("sendWireOtp error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: err?.message || "Server error" });
//   }
// };

// // ─── PROCESS WIRE TRANSFER (with OTP check) ───────────────────────────────────
// export const processWireTransfer = async (req, res) => {
//   try {
//     const {
//       amount,
//       description,
//       transactionPin,
//       otp,
//       fullname,
//       country,
//       bankname,
//       iban,
//       swiftcode,
//       accountnumber,
//       type,
//     } = req.body;

//     const amt = Number(amount);
//     if (!amt || amt <= 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Amount must be greater than 0" });

//     if (!description?.trim())
//       return res
//         .status(400)
//         .json({ success: false, message: "Description is required" });

//     if (!transactionPin?.toString().trim())
//       return res
//         .status(400)
//         .json({ success: false, message: "Transaction PIN is required" });

//     if (!fullname?.trim())
//       return res
//         .status(400)
//         .json({ success: false, message: "Recipient full name is required" });

//     if (!otp?.toString().trim())
//       return res
//         .status(400)
//         .json({ success: false, message: "Verification code is required" });

//     const user = await UserModel.findById(req.user._id);
//     if (!user)
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });

//     // ✅ FIXED: was user.accountStatus — field doesn't exist in schema
//     if (user.status === "suspended" || user.status === "closed") {
//       return res.status(403).json({
//         success: false,
//         message: `Your account has been ${user.status}. ${
//           user.suspensionReason
//             ? `Reason: ${user.suspensionReason}`
//             : "Please contact support."
//         }`,
//       });
//     }

//    if (!user.isAllowedToTransfer) {
//   return res.status(403).json({
//     success: false,
//     message: user.transferDisabledReason?.trim() ||
//       "Transfers are not allowed on your account. Please contact support.",
//   });
// }

//     if (!user.transactionPin)
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "No transaction PIN set. Please set one in settings.",
//         });

//     if (String(transactionPin) !== String(user.transactionPin))
//       return res
//         .status(400)
//         .json({ success: false, message: "Incorrect transaction PIN" });

//     if (!user.wireOtpHash || !user.wireOtpExpiresAt)
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "No verification code found. Please request a new one.",
//         });

//     if (new Date() > new Date(user.wireOtpExpiresAt))
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Verification code has expired. Please request a new one.",
//         });

//     const otpValid = await bcrypt.compare(String(otp), user.wireOtpHash);
//     if (!otpValid)
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Invalid verification code. Please check and try again.",
//         });

//     user.wireOtpHash = undefined;
//     user.wireOtpExpiresAt = undefined;
//     await user.save();

//     const FEE_PERCENT = 2;
//     const fee = Number(((amt * FEE_PERCENT) / 100).toFixed(2));
//     const totalDebit = Number((amt + fee).toFixed(2));

//     const updatedUser = await UserModel.findOneAndUpdate(
//       {
//         _id: req.user._id,
//         isAllowedToTransfer: true,
//         accountBalance: { $gte: totalDebit },
//       },
//       { $inc: { accountBalance: -totalDebit } },
//       { new: true },
//     );

//     if (!updatedUser) {
//       const currentUser = await UserModel.findById(req.user._id).select(
//         "accountBalance",
//       );
//       return res.status(400).json({
//         success: false,
//         message: `Insufficient balance. Available: $${Number(currentUser?.accountBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
//       });
//     }

//     const history = await wireTransferHistoryModel.create({
//       user: req.user._id,
//       fullname: fullname.trim(),
//       country: country?.trim() || "",
//       bankname: bankname?.trim() || "",
//       accountnumber: accountnumber?.trim() || "",
//       swiftcode: swiftcode?.trim() || "",
//       iban: iban?.trim() || "",
//       type: type?.trim() || "International transfer",
//       amount: amt,
//       currency: updatedUser.usercurrency || "USD",
//       description: description.trim(),
//       fee,
//       status: "successful",
//       reference: makeRef("WIRE"),
//     });

//     return res.status(201).json({
//       success: true,
//       message: `Transfer of $${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })} submitted successfully.`,
//       data: history,
//       newBalance: updatedUser.accountBalance,
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: err?.message || "Server error" });
//   }
// };

// // ─── GET HISTORY ─────────────────────────────────────────────────────────────
// export const getWireTransferHistory = async (req, res) => {
//   try {
//     const history = await wireTransferHistoryModel
//       .find({ user: req.user._id })
//       .sort({ createdAt: -1 })
//       .select(
//         "reference createdAt amount currency description fee status fullname bankname country accountnumber swiftcode iban type",
//       );

//     return res.json({
//       success: true,
//       message: "History fetched",
//       data: history,
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: err?.message || "Server error" });
//   }
// };

import bcrypt from "bcrypt";
import UserModel from "../models/UserModel.js";
import wireTransferHistoryModel from "../models/wireTransferHistoryModel.js";
import resend from "../lib/resend.js";

function makeRef(prefix = "WIRE") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

function gen6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── SEND OTP ────────────────────────────────────────────────────────────────
// ✅ We run ALL pre-checks here so the frontend can show the error modal
// before the OTP modal ever opens.
export const sendWireOtp = async (req, res) => {
  try {
    console.log("sendWireOtp body:", JSON.stringify(req.body));
    const { amount, transactionPin, fullname, description } = req.body;

    // ── Basic field checks ──
    // parse amount — handle string, number, or empty
    const amt = parseFloat(String(amount || "").trim());
    if (!amt || isNaN(amt) || amt <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0." });

    if (!fullname?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Recipient full name is required." });

    if (!description?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Description is required." });

    if (!transactionPin?.toString().trim())
      return res
        .status(400)
        .json({ success: false, message: "Transaction PIN is required." });

    // ── Load user ──
    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // ── Account status check ──
    if (user.status === "suspended" || user.status === "closed") {
      return res.status(403).json({
        success: false,
        message: `Your account has been ${user.status}. ${
          user.suspensionReason
            ? `Reason: ${user.suspensionReason}`
            : "Please contact support."
        }`,
      });
    }

    // ── Transfer permission check ──
    if (!user.isAllowedToTransfer) {
      return res.status(403).json({
        success: false,
        message:
          user.transferDisabledReason?.trim() ||
          "Transfers are not allowed on your account. Please contact support.",
      });
    }

    // ── Transaction PIN check ──
    if (!user.transactionPin)
      return res.status(400).json({
        success: false,
        message: "No transaction PIN set. Please set one in account settings.",
      });

    if (String(transactionPin) !== String(user.transactionPin))
      return res
        .status(400)
        .json({ success: false, message: "Incorrect transaction PIN." });

    // ── Balance check ──
    const FEE_PERCENT = 2;
    const fee = Number(((amt * FEE_PERCENT) / 100).toFixed(2));
    const totalDebit = Number((amt + fee).toFixed(2));

    if (user.accountBalance < totalDebit) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${Number(
          user.accountBalance || 0,
        ).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      });
    }

    // ── All checks passed — generate and send OTP ──
    const otp = gen6();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.wireOtpHash = otpHash;
    user.wireOtpExpiresAt = otpExpiry;
    await user.save();

    const name =
      `${user.firstname || ""} ${user.lastname || ""}`.trim() || "Customer";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transfer Verification</title>
      </head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:#033d75;padding:28px 32px 22px;text-align:center;">
                    <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Barclays Wealth</div>
                    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px;">Secure Transfer Verification</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0f1a2e;">Hello, ${name}</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                      You requested to authorize a cross-border wire transfer. Use the verification code below to complete the process.
                    </p>
                    <div style="background:#f8fafc;border:2px dashed #c7d9f5;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:10px;">Your Verification Code</div>
                      <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#033d75;">${otp}</div>
                      <div style="font-size:12px;color:#94a3b8;margin-top:10px;">Expires in <strong>10 minutes</strong></div>
                    </div>
                    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;line-height:1.5;">
                      If you did not initiate this transfer, please ignore this email and contact support immediately.
                    </p>
                    <p style="margin:0;font-size:13px;color:#94a3b8;">
                      Do not share this code with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:18px 32px;text-align:center;">
                    <div style="font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Barclays Wealth. All rights reserved.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
      to: user.email,
      subject: "Your Wire Transfer Verification Code",
      html,
    });

    if (error) {
      console.error("Wire OTP email error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    return res.json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (err) {
    console.error("sendWireOtp error:", err);
    return res
      .status(500)
      .json({ success: false, message: err?.message || "Server error" });
  }
};

// ─── PROCESS WIRE TRANSFER (OTP check + debit only) ──────────────────────────
// At this point all business logic was already validated in sendWireOtp.
// We only verify the OTP and do the actual debit here.
export const processWireTransfer = async (req, res) => {
  try {
    const {
      amount,
      description,
      transactionPin,
      otp,
      fullname,
      country,
      bankname,
      iban,
      swiftcode,
      accountnumber,
      type,
    } = req.body;

    const amt = parseFloat(String(amount || "").trim());
    if (!amt || isNaN(amt) || amt <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0." });

    if (!otp?.toString().trim())
      return res
        .status(400)
        .json({ success: false, message: "Verification code is required." });

    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // ── Re-check account status (safety net) ──
    if (user.status === "suspended" || user.status === "closed") {
      return res.status(403).json({
        success: false,
        message: `Your account has been ${user.status}. Please contact support.`,
      });
    }

    if (!user.isAllowedToTransfer) {
      return res.status(403).json({
        success: false,
        message:
          user.transferDisabledReason?.trim() ||
          "Transfers are not allowed on your account. Please contact support.",
      });
    }

    // ── OTP check ──
    if (!user.wireOtpHash || !user.wireOtpExpiresAt)
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one.",
      });

    if (new Date() > new Date(user.wireOtpExpiresAt))
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });

    const otpValid = await bcrypt.compare(String(otp), user.wireOtpHash);
    if (!otpValid)
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again.",
      });

    // ── Clear OTP ──
    user.wireOtpHash = undefined;
    user.wireOtpExpiresAt = undefined;
    await user.save();

    // ── Debit balance ──
    const FEE_PERCENT = 2;
    const fee = Number(((amt * FEE_PERCENT) / 100).toFixed(2));
    const totalDebit = Number((amt + fee).toFixed(2));

    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: req.user._id,
        isAllowedToTransfer: true,
        accountBalance: { $gte: totalDebit },
      },
      { $inc: { accountBalance: -totalDebit } },
      { new: true },
    );

    if (!updatedUser) {
      const currentUser = await UserModel.findById(req.user._id).select(
        "accountBalance",
      );
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${Number(
          currentUser?.accountBalance || 0,
        ).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      });
    }

    // ── Save history ──
    const history = await wireTransferHistoryModel.create({
      user: req.user._id,
      fullname: fullname?.trim(),
      country: country?.trim() || "",
      bankname: bankname?.trim() || "",
      accountnumber: accountnumber?.trim() || "",
      swiftcode: swiftcode?.trim() || "",
      iban: iban?.trim() || "",
      type: type?.trim() || "International transfer",
      amount: amt,
      currency: updatedUser.usercurrency || "USD",
      description: description?.trim(),
      fee,
      status: "successful",
      reference: makeRef("WIRE"),
    });

    return res.status(201).json({
      success: true,
      message: `Transfer of $${amt.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })} submitted successfully.`,
      data: history,
      newBalance: updatedUser.accountBalance,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err?.message || "Server error" });
  }
};

// ─── GET HISTORY ─────────────────────────────────────────────────────────────
export const getWireTransferHistory = async (req, res) => {
  try {
    const history = await wireTransferHistoryModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select(
        "reference createdAt amount currency description fee status fullname bankname country accountnumber swiftcode iban type",
      );

    return res.json({
      success: true,
      message: "History fetched",
      data: history,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err?.message || "Server error" });
  }
};
