import UserModel from "../models/UserModel.js";

export const setTransactionPin = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId; // ✅ allow auth user first
    const { pin, cpin } = req.body;

    if (!userId || !pin || !cpin) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    const p = String(pin).trim();
    const cp = String(cpin).trim();

    if (p !== cp) {
      return res.status(400).json({ ok: false, message: "PINs do not match" });
    }

    if (!/^\d{4}$/.test(p)) {
      return res
        .status(400)
        .json({ ok: false, message: "Transaction PIN must be 4 digits" });
    }

    const user = await UserModel.findById(userId).select(
      "emailVerified transactionPin",
    );
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    if (!user.emailVerified) {
      return res.status(403).json({ ok: false, message: "Verify email first" });
    }

    user.transactionPin = p; // ✅ THIS WAS MISSING
    await user.save();

    return res.json({ ok: true, message: "Transaction PIN set successfully" });
  } catch (err) {
    console.error("setTransactionPin error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
