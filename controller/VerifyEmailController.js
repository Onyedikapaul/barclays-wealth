import UserModel from "../models/UserModel.js";
import bcrypt from "bcrypt";

export const verifyEmail = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing userId or code" });
    }

    const user = await UserModel.findById(userId).select(
      "emailVerified emailVerifyCodeHash emailVerifyCodeExpiresAt",
    );

    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });
    if (user.emailVerified)
      return res.json({ ok: true, message: "Already verified" });

    if (!user.emailVerifyCodeHash || !user.emailVerifyCodeExpiresAt) {
      return res
        .status(400)
        .json({ ok: false, message: "No verification code found" });
    }

    if (new Date() > user.emailVerifyCodeExpiresAt) {
      return res.status(400).json({ ok: false, message: "Code expired" });
    }

    const match = await bcrypt.compare(String(code), user.emailVerifyCodeHash);
    if (!match)
      return res.status(400).json({ ok: false, message: "Invalid code" });

    user.emailVerified = true;
    user.emailVerifyCodeHash = null;
    user.emailVerifyCodeExpiresAt = null;
    await user.save();

    return res.json({
      ok: true,
      message: "Email verified. Set transaction PIN next.",
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
