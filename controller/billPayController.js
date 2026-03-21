import mongoose from "mongoose";
import Payee from "../models/PayeeModel.js";
import UserModel from "../models/UserModel.js";
import BillPay from "../models/BillPayModel.js";

/**
 * GET /api/bill-pay/payees
 */
export const getMyPayees = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payees = await Payee.find({ userId })
      .sort({ favorite: -1, createdAt: -1 })
      .select("name method account favorite createdAt");

    return res.json({ payees });
  } catch (err) {
    console.error("getMyPayees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/bill-pay
 * body: payeeid, dated, amount, memo, transactionPin
 */
function makeRef(prefix = "BP") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

const FEE_RATE = 0.015;

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export const createBillPay = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { payeeid, amount, memo, transactionPin } = req.body;

    if (!payeeid || !amount || !transactionPin) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // const deliveryDate = new Date(dated);
    // if (Number.isNaN(deliveryDate.getTime())) {
    //   return res.status(400).json({ message: "Invalid delivery date" });
    // }

    // payee must belong to user
    const payee = await Payee.findOne({ _id: payeeid, userId });
    if (!payee) {
      return res
        .status(404)
        .json({ message: "Payee not found. Please add a payee." });
    }

    // check pin + read balance (single read)
    const userDoc = await UserModel.findById(userId).select(
      "accountBalance usercurrency transactionPin isAllowedToTransfer",
    );
    if (!userDoc) return res.status(404).json({ message: "User not found" });

    if (!userDoc.isAllowedToTransfer) {
      return res.status(403).json({
        ok: false,
        message:
          `Transaction Error:  Reason: ${userDoc.transferDisabledReason}` ||
          "Transfers are not allowed on your account",
      });
    }

    if (userDoc.status !== "active") {
      return res.status(403).json({
        ok: false,
        message: `Your account is suspended, Reason: ${userDoc.suspensionReason || "We found suspicious activities on your account  and have temporarily suspended it for your protection. Please contact support for more information."}`,
      });
    }

    if (String(transactionPin) !== String(userDoc.transactionPin)) {
      return res.status(400).json({ message: "Incorrect transaction PIN" });
    }

    const bal = Number(userDoc.accountBalance || 0);
    if (bal < amt) {
      return res.status(400).json({
        ok: false,
        message: `Insufficient balance. Available balance: $${bal}`,
      });
    }

    const fee = round2(amt * FEE_RATE);
    const totalDebit = round2(amt + fee);
    const reference = makeRef();

    // ✅ Atomic debit: only succeeds if balance >= totalDebit
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId, accountBalance: { $gte: totalDebit } },
      { $inc: { accountBalance: -totalDebit } },
      { new: true },
    ).select("accountBalance usercurrency");

    if (!updatedUser) {
      return res.status(400).json({
        message: `Insufficient balance, your balance is $${userDoc.accountBalance}`,
      });
    }

    // save history
    await BillPay.create({
      userId,
      payeeId: payee._id,
      payeeSnapshot: {
        name: payee.name,
        method: payee.method,
        account: payee.account,
        address1: payee.address1,
        address2: payee.address2,
        city: payee.city,
        state: payee.state,
        zipcode: payee.zipcode,
      },
      amount: round2(amt),
      currency: updatedUser.usercurrency || "USD",
      feeRate: FEE_RATE,
      fee,
      totalDebit,
      deliveryDate: null,
      memo: memo?.trim() || "",
      status: "completed",
      reference,
    });

    return res.status(201).json({
      message: "Bill payment submitted successfully ✅",
      reference,
      amount: round2(amt),
      fee,
      totalDebit,
      newBalance: updatedUser.accountBalance,
    });
  } catch (err) {
    console.error("createBillPay error:", err);
    return res.status(500).json({ message: "Server error. Please try again" });
  }
};

/**
 * GET /api/bill-pay/history
 */
export const getBillPayHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const history = await BillPay.find({ userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .select(
        "reference amount fee totalDebit currency deliveryDate status memo createdAt payeeSnapshot",
      );

    return res.json({ history });
  } catch (err) {
    console.error("getBillPayHistory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
