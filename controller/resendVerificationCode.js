import mongoose from "mongoose";
import bcrypt from "bcrypt";
import resend from "../lib/resend.js";
import UserModel from "../models/UserModel.js";
import { verificationEmailTemplate } from "../lib/email-verification-template.js";

function gen6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || String(userId).trim() === "") {
      return res.status(400).json({ ok: false, message: "Missing userId" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, message: "Invalid userId" });
    }

    const user = await UserModel.findById(userId).select(
      "email firstname lastname emailVerified",
    );

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    if (user.emailVerified) {
      return res
        .status(400)
        .json({ ok: false, message: "Email is already verified" });
    }

    // ✅ Generate and store new code (10 mins)
    const code = gen6DigitCode();
    const codeHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.findByIdAndUpdate(
      userId,
      {
        emailVerifyCodeHash: codeHash,
        emailVerifyCodeExpiresAt: expiresAt,
      },
      { new: false },
    );

    const name = [user.firstname, user.lastname]
      .filter(Boolean)
      .join(" ")
      .trim();

    const html = verificationEmailTemplate({
      name: name || "there",
      code: code,
    });

    // ✅ Send email via Resend
    await resend.emails.send({
      from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
      to: [user.email],
      subject: "Verify Your Email | Barclays Wealth",
      html: html,
    });

    return res.json({ ok: true, message: "Verification code resent" });
  } catch (err) {
    console.error("resendVerificationCode error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to resend verification code" });
  }
};
