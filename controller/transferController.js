import resend from "../lib/resend.js";
import { transferConfirmationEmailTemplate } from "../lib/transferConfirmationEmailTemplate.js";
import { transferSuccessEmailTemplate } from "../lib/transferSuccessEmailTemplate.js";
import TransactionModel from "../models/TransactionModel.js";
import UserModel from "../models/UserModel.js";
import { makeTxRef } from "../utils/ref.js";
import bcrypt from "bcrypt"; // ✅ use bcryptjs for consistency

function genOtp(len = 6) {
  const n = Math.max(4, Math.min(6, Number(len) || 6)); // 4..6
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export const createTransferDraft = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Not authenticated" });

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid amount" });
    }
    if (amount < 5) {
      return res
        .status(400)
        .json({ ok: false, message: "Minimum transfer is 5.00" });
    }

    const user = await UserModel.findById(userId);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    if (user.status !== "active") {
      return res.status(403).json({
        ok: false,
        message: `Your account is suspended, Reason: ${
          user.suspensionReason ||
          "We found suspicious activities on your account and have temporarily suspended it for your protection. Please contact support for more information."
        }`,
      });
    }

    if (!user.isAllowedToTransfer) {
      return res.status(403).json({
        ok: false,
        message:
          user.transferDisabledReason ||
          "Transfers are not allowed on your account",
      });
    }

    if (user.accountBalance < amount) {
      return res.status(400).json({
        ok: false,
        message: `Insufficient balance. Available balance: $${user.accountBalance}`,
      });
    }

    const tx = await TransactionModel.create({
      user: userId,
      ref: makeTxRef(),
      type: "debit",
      scope: "local",
      title: "Transfer",
      amount,
      currency: user.usercurrency || "USD",
      status: "draft",
    });

    return res.json({
      ok: true,
      draftTxId: tx._id,
      ref: tx.ref,
      amount: tx.amount,
      currency: tx.currency,
    });
  } catch (e) {
    console.error("[TRANSFER DRAFT]", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const updateTransferDraft = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Not authenticated" });

    const { id } = req.params;
    const { bankName, accountNumber, accountName, narration } = req.body;

    const tx = await TransactionModel.findOne({ _id: id, user: userId });
    if (!tx)
      return res.status(404).json({ ok: false, message: "Draft not found" });

    if (tx.status !== "draft") {
      return res
        .status(400)
        .json({ ok: false, message: "Draft is not editable" });
    }

    tx.beneficiary.bankName = String(bankName || "").trim();
    tx.beneficiary.accountNumber = String(accountNumber || "").trim();
    tx.beneficiary.accountName = String(accountName || "").trim();
    tx.narration = String(narration || "").trim();

    if (tx.beneficiary.bankName.length < 2) {
      return res
        .status(400)
        .json({ ok: false, message: "Bank name is required" });
    }
    if (!/^\d{10,16}$/.test(tx.beneficiary.accountNumber)) {
      return res
        .status(400)
        .json({ ok: false, message: "Account number must be 10–16 digits" });
    }
    if (tx.beneficiary.accountName.length < 2) {
      return res
        .status(400)
        .json({ ok: false, message: "Account name is required" });
    }

    tx.status = "pending";
    await tx.save();

    const fullTx = await TransactionModel.findById(tx._id)
      .select(
        "_id user ref type scope title amount currency beneficiary narration status done createdAt updatedAt",
      )
      .lean();

    return res.json({
      ok: true,
      message: "Draft updated",
      transaction: {
        ...fullTx,
        description: fullTx?.narration || "",
        date: fullTx?.createdAt,
        dateText: fullTx?.createdAt
          ? new Date(fullTx.createdAt).toLocaleString()
          : "",
      },
    });
  } catch (e) {
    console.error("[TRANSFER DRAFT UPDATE]", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const confirmTransferDraft = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Not authenticated" });

    const { draftTxId, pin } = req.body;

    if (!draftTxId)
      return res.status(400).json({ ok: false, message: "Missing draftTxId" });
    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res
        .status(400)
        .json({ ok: false, message: "PIN must be 4 digits" });
    }

    const user = await UserModel.findById(userId);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    if (!user.isAllowedToTransfer) {
      return res.status(403).json({
        ok: false,
        message:
          user.transferDisabledReason ||
          "Transfers are not allowed on your account",
      });
    }

    const tx = await TransactionModel.findOne({ _id: draftTxId, user: userId });
    if (!tx)
      return res.status(404).json({ ok: false, message: "Draft not found" });

    if (tx.done === true) {
      return res
        .status(400)
        .json({ ok: false, message: "Transaction already completed" });
    }

    if (tx.status !== "pending" && tx.status !== "otp_required") {
      return res
        .status(400)
        .json({ ok: false, message: "Draft not ready for confirmation" });
    }

    if (
      !tx.beneficiary?.bankName ||
      !tx.beneficiary?.accountNumber ||
      !tx.beneficiary?.accountName
    ) {
      return res
        .status(400)
        .json({ ok: false, message: "Beneficiary details missing" });
    }

    const storedPin = String(user.transactionPin ?? "").trim();
    const inputPin = String(pin ?? "").trim();

    if (!storedPin)
      return res
        .status(400)
        .json({ ok: false, message: "Transaction PIN not set" });
    if (storedPin !== inputPin)
      return res
        .status(401)
        .json({ ok: false, message: "Incorrect transaction PIN" });

    const bal = Number(user.accountBalance || 0);
    if (bal < tx.amount) {
      return res.status(400).json({
        ok: false,
        message: `Insufficient balance. Available balance: $${bal}`,
      });
    }

    // ✅ resend throttle (30s)
    const lastSent = tx.transferOtpSentAt
      ? new Date(tx.transferOtpSentAt).getTime()
      : 0;
    if (lastSent && Date.now() - lastSent < 30 * 1000) {
      return res
        .status(429)
        .json({
          ok: false,
          message: "Please wait before requesting another code.",
        });
    }

    const otp = genOtp(6);
    tx.transferOtpHash = await bcrypt.hash(String(otp), 12);
    tx.transferOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    tx.transferOtpSentAt = new Date(); // ✅ important
    tx.transferOtpAttempts = 0;
    tx.status = "otp_required";
    await tx.save();

    const html = transferConfirmationEmailTemplate({
      name: `${user.firstname} ${user.lastname}`,
      code: otp,
      amount: String(tx.amount),
      currency: tx.currency || user.usercurrency || "USD",
      beneficiaryName: tx.beneficiary?.accountName,
      beneficiaryBank: tx.beneficiary?.bankName,
      beneficiaryAccountMasked: String(
        tx.beneficiary?.accountNumber || "",
      ).replace(/\d(?=\d{4})/g, "*"),
      reference: tx.ref,
      initiatedAt: new Date().toLocaleString(),
    });

    try {
      const { error } = await resend.emails.send({
        from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
        to: user.email,
        subject: "Confirm Transfer (OTP) | Barclays Wealth",
        html,
      });

      if (error) {
        console.error("❌ Resend error:", JSON.stringify(error, null, 2));
        return res.status(500).json({
          ok: false,
          message: "Failed to send confirmation code. Please try again.",
          emailError: true,
        });
      }
    } catch (emailError) {
      console.error("❌ Email exception:", emailError);
      return res.status(500).json({
        ok: false,
        message: "Failed to send confirmation code. Please try again.",
        emailError: true,
      });
    }

    return res.json({
      ok: true,
      message: "OTP sent to your email",
      needsOtp: true,
      draftTxId: tx._id,
      ref: tx.ref,
      expiresInSeconds: 10 * 60,
    });
  } catch (e) {
    console.error("[TRANSFER CONFIRM -> OTP]", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const finalizeTransferDraft = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Not authenticated" });

    const { draftTxId, otp } = req.body;

    if (!draftTxId)
      return res.status(400).json({ ok: false, message: "Missing draftTxId" });

    const otpClean = String(otp || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (otpClean.length !== 4 && otpClean.length !== 6) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP must be 4 or 6 digits" });
    }

    const user = await UserModel.findById(userId);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    const tx = await TransactionModel.findOne({ _id: draftTxId, user: userId });
    if (!tx)
      return res.status(404).json({ ok: false, message: "Draft not found" });

    if (tx.done === true) {
      return res
        .status(400)
        .json({ ok: false, message: "Transaction already completed" });
    }

    if (tx.status !== "otp_required") {
      return res
        .status(400)
        .json({ ok: false, message: "OTP not requested for this transfer" });
    }

    if (!tx.transferOtpHash || !tx.transferOtpExpiresAt) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "OTP missing. Please request a new code.",
        });
    }

    if (new Date(tx.transferOtpExpiresAt).getTime() < Date.now()) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "OTP expired. Please request a new code.",
        });
    }

    tx.transferOtpAttempts = Number(tx.transferOtpAttempts || 0) + 1;

    if (tx.transferOtpAttempts > 5) {
      tx.status = "failed";
      await tx.save();
      return res
        .status(429)
        .json({ ok: false, message: "Too many wrong OTP attempts." });
    }

    const otpOk = await bcrypt.compare(
      String(otpClean),
      String(tx.transferOtpHash),
    );
    if (!otpOk) {
      await tx.save();
      return res.status(401).json({ ok: false, message: "Incorrect OTP" });
    }

    const bal = Number(user.accountBalance || 0);
    if (bal < tx.amount) {
      return res.status(400).json({
        ok: false,
        message: `Insufficient balance. Available balance: $${bal}`,
      });
    }

    user.accountBalance = bal - tx.amount;
    await user.save();

    tx.status = "success";
    tx.done = true;
    tx.transferOtpHash = "";
    tx.transferOtpExpiresAt = null;
    await tx.save();

    // ✅ return transaction for receipt modal
    const fullTx = await TransactionModel.findById(tx._id)
      .select(
        "_id user ref type scope title amount currency beneficiary narration status done createdAt updatedAt",
      )
      .lean();

    // ✅ send success email
    try {
      const html = transferSuccessEmailTemplate({
        name: `${user.firstname} ${user.lastname}`,
        amount: String(tx.amount),
        currency: tx.currency || user.usercurrency || "USD",
        beneficiaryName: tx.beneficiary?.accountName,
        beneficiaryBank: tx.beneficiary?.bankName,
        beneficiaryAccountMasked: String(
          tx.beneficiary?.accountNumber || "",
        ).replace(/\d(?=\d{4})/g, "*"),
        reference: tx.ref,
        transactionId: String(tx._id),
        completedAt: new Date().toLocaleString(),
        status: "Successful",
      });

      const { error } = await resend.emails.send({
        from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
        to: user.email,
        subject: "Transfer Successful | Barclays Wealth",
        html,
      });

      if (error)
        console.error(
          "❌ Resend error (success email):",
          JSON.stringify(error, null, 2),
        );
    } catch (e) {
      console.error("❌ Success email exception:", e);
    }

    return res.json({
      ok: true,
      message: "Transfer successful",
      newBalance: user.accountBalance,
      transaction: fullTx
        ? {
            ...fullTx,
            description: fullTx?.narration || "",
            date: fullTx?.createdAt,
            dateText: fullTx?.createdAt
              ? new Date(fullTx.createdAt).toLocaleString()
              : "",
          }
        : null,
    });
  } catch (e) {
    console.error("[TRANSFER FINALIZE]", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
