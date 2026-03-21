import mongoose from "mongoose";
import UserModel from "../../models/UserModel.js";
import TransactionModel from "../../models/TransactionModel.js";

// ===============================
// Helper: Generate Transaction Ref
// ===============================
function generateRef() {
  return (
    "TX-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
}

// ===============================
// GET /api/admin/users/:id
// ===============================
export const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await UserModel.findById(id)
      .select(
        "_id firstname middlename lastname email accountNumber accountBalance",
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("getAdminUserById error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// CREDIT USER
// POST /api/admin/transfer/credit
// ===============================
export const adminCreditUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      amount,
      currency,
      title,
      narration,
      scope,
      status,
      beneficiary,
      createdAt,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await UserModel.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const ref = generateRef();

    let customCreatedAt = null;

    if (createdAt) {
      const d = new Date(createdAt);
      if (Number.isNaN(d.getTime())) throw new Error("Invalid createdAt date");
      customCreatedAt = d;
    }

    // ✅ Increase balance ONLY if status is success
    if (status === "success") {
      user.accountBalance = Number(user.accountBalance || 0) + amt;
      await user.save({ session });
    }

    // const transaction = await TransactionModel.create(
    //   [
    //     {
    //       user: user._id,
    //       ref,
    //       type: "credit",
    //       scope,
    //       title,
    //       amount: amt,
    //       currency,
    //       beneficiary,
    //       narration,
    //       status,
    //       done: status === "success",
    //       createdAt: customCreatedAt,
    //       updatedAt: customCreatedAt,
    //     },
    //   ],
    //   { session },
    // );

    const transaction = await TransactionModel.create(
      [
        {
          user: user._id,
          ref,
          type: "credit",
          scope,
          title,
          amount: amt,
          currency,
          beneficiary,
          narration,
          status,
          done: true,

          ...(customCreatedAt
            ? { createdAt: customCreatedAt, updatedAt: customCreatedAt }
            : {}),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "User credited successfully",
      transaction: transaction[0],
      user,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("adminCreditUser error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ===============================
// DEBIT USER
// POST /api/admin/transfer/debit
// ===============================
export const adminDebitUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      amount,
      currency,
      title,
      narration,
      scope,
      status,
      beneficiary,
      createdAt,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await UserModel.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // ✅ Prevent negative balance (only if success)
    if (status === "success") {
      if (Number(user.accountBalance || 0) < amt) {
        throw new Error("Insufficient balance");
      }

      user.accountBalance = Number(user.accountBalance || 0) - amt;
      await user.save({ session });
    }

    let customCreatedAt = null;

    if (createdAt) {
      const d = new Date(createdAt);
      if (Number.isNaN(d.getTime())) throw new Error("Invalid createdAt date");
      customCreatedAt = d;
    }

    const ref = generateRef();

    // const transaction = await TransactionModel.create(
    //   [
    //     {
    //       user: user._id,
    //       ref,
    //       type: "debit",
    //       scope,
    //       title,
    //       amount: amt,
    //       currency,
    //       beneficiary,
    //       narration,
    //       status,
    //       done: status === "success",
    //       createdAt: customCreatedAt,
    //       updatedAt: customCreatedAt,
    //     },
    //   ],
    //   { session },
    // );

    const transaction = await TransactionModel.create(
      [
        {
          user: user._id,
          ref,
          type: "debit",
          scope,
          title,
          amount: amt,
          currency,
          beneficiary,
          narration,
          status,
          done: true,

          ...(customCreatedAt
            ? { createdAt: customCreatedAt, updatedAt: customCreatedAt }
            : {}),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "User debited successfully",
      transaction: transaction[0],
      user,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("adminDebitUser error:", error);
    res.status(400).json({ message: error.message });
  }
};
