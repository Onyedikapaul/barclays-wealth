import mongoose from "mongoose";
import wireTransferHistoryModel from "../../models/wireTransferHistoryModel.js";
import UserModel from "../../models/UserModel.js";
import wireTransferModel from "../../models/wireTransferModel.js";

function makeRef(prefix = "WIRE") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

// ─── GET all wire transfers for a specific user ───────────────────────────────
export const getUserWireTransfers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });

    const user = await UserModel.findById(userId)
      .select("firstname lastname email accountBalance")
      .lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ── Build name from firstname + lastname ──
    user.name = `${user.firstname || ""} ${user.lastname || ""}`.trim();
    user.balance = user.accountBalance;

    const transfers = await wireTransferHistoryModel
      .find({ user: userId })
      .populate(
        "recipient",
        "fullname bankname country city state address iban swiftcode accountnumber accountholder accounttype email phone",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      user,
      transfers,
      total: transfers.length,
    });
  } catch (err) {
    console.error("getUserWireTransfers error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE status of a wire transfer ────────────────────────────────────────
// Balance logic (total = amount + fee, was already deducted on submission):
//
//   any        → successful  : nothing   (already deducted on submit)
//   any        → processing  : nothing   (still in review)
//   any        → pending     : nothing   (reset, no balance change)
//   non-failed → failed      : +total    (refund)
//   failed     → non-failed  : -total    (re-deduct)
// ─────────────────────────────────────────────────────────────────────────────
export const updateWireTransferStatus = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { status: newStatus } = req.body;

    const validStatuses = ["pending", "processing", "successful", "failed"];
    if (!validStatuses.includes(newStatus))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });

    if (!mongoose.Types.ObjectId.isValid(transferId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid transfer ID" });

    const transfer = await wireTransferHistoryModel.findById(transferId);
    if (!transfer)
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });

    if (transfer.status === newStatus)
      return res
        .status(400)
        .json({ success: false, message: `Transfer is already ${newStatus}` });

    const prevStatus = transfer.status;
    const totalDebit = Number(
      (transfer.amount + (transfer.fee || 0)).toFixed(2),
    );

    const user = await UserModel.findById(transfer.user);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ── Balance logic ──
    if (newStatus === "failed" && prevStatus !== "failed") {
      // Refund — transfer reversed
      await UserModel.findByIdAndUpdate(transfer.user, {
        $inc: { accountBalance: totalDebit },
      });
    } else if (prevStatus === "failed" && newStatus !== "failed") {
      // Re-deduct — coming back from failed
      if (user.accountBalance < totalDebit) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. User has $${user.accountBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}, transfer total is $${totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        });
      }
      await UserModel.findByIdAndUpdate(transfer.user, {
        $inc: { accountBalance: -totalDebit },
      });
    }
    // all other transitions = no balance change

    transfer.status = newStatus;
    await transfer.save();

    return res.json({
      success: true,
      message: `Transfer marked as ${newStatus}`,
      transfer,
    });
  } catch (err) {
    console.error("updateWireTransferStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/wire-transfers/user/:userId/add ──────────────────────────
export const adminAddWireTransfer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });

    const {
      amount,
      fee,
      description,
      status,
      createdAt,
      fullname,
      bankname,
      country,
      state,
      city,
      address,
      zipcode,
      email,
      phone,
      iban,
      swiftcode,
      accountnumber,
      accountholder,
      accounttype,
    } = req.body;

    // ── Validations ──
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0" });

    if (!description?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Description is required" });

    if (!fullname?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Recipient full name is required" });

    const validStatuses = ["pending", "processing", "successful", "failed"];
    const resolvedStatus = status || "pending";
    if (!validStatuses.includes(resolvedStatus))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });

    // ── Load user ──
    const user = await UserModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ── Check account status ──
    // if (user.status === "suspended" || user.status === "closed") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `User account is ${user.status}. ${user.suspensionReason ? `Reason: ${user.suspensionReason}` : ""}`,
    //   });
    // }

    const parsedFee = parseFloat(fee) || 0;
    const totalDebit = parseFloat((parsedAmount + parsedFee).toFixed(2));

    // ── Balance logic ──
    // successful / processing → deduct accountBalance
    // pending / failed        → no deduction
    if (resolvedStatus === "successful" || resolvedStatus === "processing") {
      if (user.accountBalance < totalDebit) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. User has $${user.accountBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}, total is $${totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        });
      }
      await UserModel.findByIdAndUpdate(userId, {
        $inc: { accountBalance: -totalDebit },
      });
    }

    // ── Create recipient record ──
    const recipient = await wireTransferModel.create({
      user: userId,
      fullname: fullname.trim(),
      bankname: bankname || "",
      country: country || "",
      state: state || "",
      city: city || "",
      address: address || "",
      zipcode: zipcode || "",
      email: email || "",
      phone: phone || "",
      iban: iban || "",
      swiftcode: swiftcode || "",
      accountnumber: accountnumber || "",
      accountholder: accountholder || "",
      accounttype: accounttype || "",
      type: "International transfer",
    });

    // ── Create transfer record ──
    const transferData = {
      user: userId,
      recipient: recipient._id,
      amount: parsedAmount,
      fee: parsedFee,
      currency: "USD",
      description: description.trim(),
      status: resolvedStatus,
      reference: makeRef(),
    };

    if (createdAt) {
      const parsedDate = new Date(createdAt);
      if (!isNaN(parsedDate.getTime())) {
        transferData.createdAt = parsedDate;
      }
    }

    const transfer = await wireTransferHistoryModel.create(transferData);

    return res.status(201).json({
      success: true,
      message: `Wire transfer added${
        resolvedStatus === "successful" || resolvedStatus === "processing"
          ? ` and $${totalDebit.toFixed(2)} deducted from balance`
          : ""
      }`,
      transfer,
      recipient,
    });
  } catch (err) {
    console.error("adminAddWireTransfer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
