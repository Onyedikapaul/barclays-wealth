import crypto from "crypto";
import mongoose from "mongoose";
import UserModel from "../models/UserModel.js";
import TransactionModel from "../models/TransactionModel.js";

function makeRef(prefix = "TRX") {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
}

export const adminCreditUser = async (req, res) => {
  try {
    const {
      userId,
      title,
      amount,
      currency = "USD",
      scope = "local",
      narration = "",
      beneficiary = {}, // ✅ sender details
      status = "success",
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!title || String(title).trim().length < 2) {
      return res.status(400).json({ message: "Title is required" });
    }

    // ✅ validate sender details (beneficiary is "sender info" here)
    const bankName = String(beneficiary.bankName || "").trim();
    const accountNumber = String(beneficiary.accountNumber || "").trim();
    const accountName = String(beneficiary.accountName || "").trim();

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        message:
          "Sender details required: bankName, accountNumber, accountName",
      });
    }

    const user = await UserModel.findById(userId)
      .select("_id email accountBalance")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const ref = makeRef("CR");

    const tx = await TransactionModel.create({
      user: user._id,
      ref,
      type: "credit",
      scope,
      title: String(title).trim(),
      amount: amt,
      currency,
      beneficiary: {
        bankName,
        accountNumber,
        accountName,
      },
      narration: String(narration || "").trim(),
      status,
      done: status === "success",
    });

    let updatedUser = null;
    if (status === "success") {
      updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { accountBalance: amt } },
        { new: true, select: "_id email accountBalance" },
      ).lean();
    }

    return res.status(201).json({
      message:
        status === "success"
          ? "User credited successfully and balance updated"
          : "Transaction created (balance not updated because status is not success)",
      transaction: tx,
      user: updatedUser,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate transaction ref. Try again." });
    }
    console.error("adminCreditUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
