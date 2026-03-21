import mongoose from "mongoose";
import TransactionModel from "../../models/TransactionModel.js";
import UserModel from "../../models/UserModel.js";
;

// GET /api/admin/user/transactions?userId=...&limit=50&page=1
export const adminGetUserTransactions = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ ok: false, message: "Invalid userId" });
    }

    const limit = Math.min(Number(req.query.limit || 50), 200);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    const [rows, total, user] = await Promise.all([
      TransactionModel.find({ user: userId, done: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransactionModel.countDocuments({ user: userId }),
      UserModel.findById(userId)
        .select("_id firstname lastname email accountBalance usercurrency")
        .lean(),
    ]);

    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    return res.json({
      ok: true,
      total,
      page,
      limit,
      user,
      transactions: rows,
    });
  } catch (e) {
    console.error("[ADMIN GET USER TX]", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

// PATCH /api/admin/transactions/:txId
// Body: { status?: "...", refund?: true/false, note?: "..." }
export const adminUpdateTransaction = async (req, res) => {
  try {
    const { txId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(txId)) {
      return res.status(400).json({ ok: false, message: "Invalid txId" });
    }

    const { status, refund, note } = req.body || {};

    console.log("[ADMIN UPDATE TX] body:", req.body);

    const tx = await TransactionModel.findById(txId);
    if (!tx)
      return res
        .status(404)
        .json({ ok: false, message: "Transaction not found" });

    const user = await UserModel.findById(tx.user);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    // ✅ set status if provided
    const allowedStatuses = [
      "draft",
      "pending",
      "success",
      "failed",
      "reversed",
    ];
    if (status && !allowedStatuses.includes(String(status))) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    // ✅ Refund rules:
    // - Only refund debit transactions (money went out)
    // - Only refund if tx.done === true (meaning system already deducted)
    // - Only refund once (tx.adjustment.refunded)
    const wantsRefund = refund === true;

    if (wantsRefund) {
      if (String(tx.type) !== "debit") {
        return res
          .status(400)
          .json({
            ok: false,
            message: "Only debit transactions can be refunded",
          });
      }

      if (tx.done !== true) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "Cannot refund: transaction not marked done",
          });
      }

      if (tx.adjustment?.refunded === true) {
        return res.status(400).json({ ok: false, message: "Already refunded" });
      }

      // ✅ Apply refund
      const bal = Number(user.accountBalance || 0);
      user.accountBalance = bal + Number(tx.amount || 0);
      await user.save();

      // mark tx as reversed + refunded
      tx.adjustment = tx.adjustment || {};
      tx.adjustment.refunded = true;
      tx.adjustment.refundedAt = new Date();
      tx.adjustment.note = String(note || tx.adjustment.note || "").trim();
      tx.adjustment.prevStatus = String(tx.status || "");
      // tx.adjustment.refundedBy = req.admin?._id; // if you have admin auth
      tx.status = "reversed";
      tx.done = true;
      await tx.save();

      return res.json({
        ok: true,
        message: "Refund applied and transaction reversed",
        newBalance: user.accountBalance,
        tx: tx.toObject(),
      });
    }

    // ✅ no refund: just update status + note
    if (status) {
      tx.adjustment = tx.adjustment || {};
      tx.adjustment.note = String(note || tx.adjustment.note || "").trim();
      tx.adjustment.prevStatus = String(tx.status || "");
      tx.status = status;
      await tx.save();
    }

    return res.json({
      ok: true,
      message: "Transaction updated",
      tx: tx.toObject(),
    });
  } catch (e) {
    console.error("[ADMIN UPDATE TX]", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
