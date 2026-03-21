import TransactionModel from "../models/TransactionModel.js";
import UserModel from "../models/UserModel.js";
import { makeTxRef } from "../utils/ref.js";

export function genRef(prefix = "TX") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString().slice(-6);
  return `${prefix}-${time}-${rand}`;
}

export const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Not authenticated" });
    }

    const limit = Math.min(Number(req.query.limit || 5), 200);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      TransactionModel.find({
        user: userId,
        done: true,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "_id user ref type scope title amount currency beneficiary narration status done createdAt updatedAt",
        )
        .lean(),
      TransactionModel.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      ok: true,
      total,
      page,
      limit,
      transactions: rows.map((t) => ({
        _id: t._id,
        user: t.user, // ✅ user id
        ref: t.ref,
        type: t.type,
        scope: t.scope,
        title: t.title,
        amount: t.amount,
        currency: t.currency,

        // ✅ keep both so frontend works either way
        narration: t.narration || "",
        description: t.narration || "",

        beneficiary: {
          bankName: t.beneficiary?.bankName || "",
          accountNumber: t.beneficiary?.accountNumber || "",
          accountName: t.beneficiary?.accountName || "",
        },

        status: t.status,
        done: !!t.done,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,

        // optional convenience
        date: t.createdAt,
      })),
    });
  } catch (err) {
    console.error("[TRANSACTIONS] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const listMyTransactions = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Not authenticated" });
    }

    const limit = Math.min(Number(req.query.limit || 50), 200);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      TransactionModel.find({
        user: userId,
        done: true,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "_id user ref type scope title amount currency beneficiary narration status done createdAt updatedAt",
        )
        .lean(),
      TransactionModel.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      ok: true,
      total,
      page,
      limit,
      transactions: rows.map((t) => ({
        _id: t._id,
        user: t.user, // ✅ user id
        ref: t.ref,
        type: t.type,
        scope: t.scope,
        title: t.title,
        amount: t.amount,
        currency: t.currency,

        // ✅ keep both so frontend works either way
        narration: t.narration || "",
        description: t.narration || "",

        beneficiary: {
          bankName: t.beneficiary?.bankName || "",
          accountNumber: t.beneficiary?.accountNumber || "",
          accountName: t.beneficiary?.accountName || "",
        },

        status: t.status,
        done: !!t.done,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,

        // optional convenience
        date: t.createdAt,
      })),
    });
  } catch (err) {
    console.error("[TRANSACTIONS] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const createTransfer = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, message: "Not authenticated" });

    const { amount } = req.body;

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid amount" });
    }
    if (amt < 5) {
      return res
        .status(400)
        .json({ ok: false, message: "Minimum transfer is 5.00" });
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

    if (user.status !== "active") {
      return res.status(403).json({
        ok: false,
        message: `Your account is suspended, Reason: ${user.suspensionReason || "We found suspicious activities on your account  and have temporarily suspended it for your protection. Please contact support for more information."}`,
      });
    }

    const bal = Number(user.accountBalance || 0);
    if (bal < amt) {
      return res.status(400).json({
        ok: false,
        message: `Insufficient balance. Available balance: $${bal}`,
      });
    }

    // Create transaction (pending by default)
    const tx = await TransactionModel.create({
      user: userId,
      ref: makeTxRef(),
      type: "debit",
      scope: "local",
      title: "Transfer",
      description: "Transfer initiated",
      amount: amt,
      currency: user.usercurrency || "USD",
      status: "pending",
    });

    // For now: simulate success immediately (since no real payment rails)
    user.accountBalance = bal - amt;
    await user.save();

    tx.status = "success";
    tx.description = "Transfer successful";
    await tx.save();

    return res.json({
      ok: true,
      message: "Transfer completed",
      transaction: {
        ref: tx.ref,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt,
      },
      newBalance: user.accountBalance,
    });
  } catch (err) {
    console.error("[TRANSFER] error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Your frontend sends accountId, but your schema doesn't have it.
    // So we ignore accountId safely.
    const { status, scope, limit = 200 } = req.query;

    const filter = { user: userId, done: true };

    // IMPORTANT: For donut, you usually want only successful transactions
    // If you want ALL, remove the next line
    filter.status = status || "success";

    if (scope) filter.scope = scope;

    const lim = Math.min(Number(limit) || 200, 500);

    const transactions = await TransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(lim)
      .select("type amount currency");

    // ✅ EXACT shape your frontend expects
    return res.json({ transactions });
  } catch (err) {
    console.error("getMyTransactions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};