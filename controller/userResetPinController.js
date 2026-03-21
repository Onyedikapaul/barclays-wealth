import mongoose from "mongoose";
import UserModel from "../models/UserModel.js";

/**
 * PATCH /api/user/reset-transaction-pin
 * body: { email, transactionPin }
 */
export const userResetTransactionPin = async (req, res) => {
  try {
    const id = req.user?._id;

    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const pin = String(req.body.transactionPin || "").trim();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res
        .status(400)
        .json({ message: "Transaction PIN must be exactly 4 digits" });
    }

    const user = await UserModel.findById(id)
      .select("_id email transactionPin")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const userEmail = String(user.email || "")
      .trim()
      .toLowerCase();
    if (!userEmail) {
      return res.status(400).json({ message: "User account has no email" });
    }

    if (email !== userEmail) {
      return res
        .status(400)
        .json({ message: "Email does not match this account" });
    }

    if (String(user.transactionPin || "") === pin) {
      return res
        .status(400)
        .json({ message: "New PIN cannot be the same as the current PIN" });
    }

    await UserModel.updateOne({ _id: id }, { $set: { transactionPin: pin } });

    return res.json({
      ok: true,
      message: "Transaction PIN updated successfully",
    });
  } catch (err) {
    console.error("userResetTransactionPin error:", err);
    return res.status(500).json({ message: "Failed to reset transaction PIN" });
  }
};
