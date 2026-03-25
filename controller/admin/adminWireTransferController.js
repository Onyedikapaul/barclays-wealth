import mongoose from "mongoose";
import wireTransferHistoryModel from "../../models/wireTransferHistoryModel.js";
import UserModel from "../../models/UserModel.js";

function makeRef(prefix = "WIRE") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

// ─── GET all wire transfers for a specific user ───────────────────────────────
export const getUserWireTransfers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    const user = await UserModel.findById(userId)
      .select("firstname lastname email accountBalance")
      .lean();
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.name    = `${user.firstname || ""} ${user.lastname || ""}`.trim();
    user.balance = user.accountBalance;

    const transfers = await wireTransferHistoryModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .select(
        "reference createdAt amount currency fee description status fullname bankname country accountnumber swiftcode iban type",
      )
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
export const updateWireTransferStatus = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { status: newStatus } = req.body;

    const validStatuses = ["pending", "processing", "successful", "failed"];
    if (!validStatuses.includes(newStatus))
      return res.status(400).json({ success: false, message: "Invalid status value" });

    if (!mongoose.Types.ObjectId.isValid(transferId))
      return res.status(400).json({ success: false, message: "Invalid transfer ID" });

    const transfer = await wireTransferHistoryModel.findById(transferId);
    if (!transfer)
      return res.status(404).json({ success: false, message: "Transfer not found" });

    if (transfer.status === newStatus)
      return res.status(400).json({ success: false, message: `Transfer is already ${newStatus}` });

    const prevStatus = transfer.status;
    const totalDebit = Number((transfer.amount + (transfer.fee || 0)).toFixed(2));

    const user = await UserModel.findById(transfer.user);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // ── Balance logic ──
    if (newStatus === "failed" && prevStatus !== "failed") {
      // Refund
      await UserModel.findByIdAndUpdate(transfer.user, {
        $inc: { accountBalance: totalDebit },
      });
    } else if (prevStatus === "failed" && newStatus !== "failed") {
      // Re-deduct
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

    transfer.status = newStatus;
    await transfer.save();

    return res.json({
      success:  true,
      message:  `Transfer marked as ${newStatus}`,
      transfer,
    });
  } catch (err) {
    console.error("updateWireTransferStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST admin manually add a wire transfer ──────────────────────────────────
export const adminAddWireTransfer = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    const {
      amount, fee, description, status, createdAt,
      fullname, bankname, country,
      iban, swiftcode, accountnumber, type,
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0)
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });

    if (!description?.trim())
      return res.status(400).json({ success: false, message: "Description is required" });

    if (!fullname?.trim())
      return res.status(400).json({ success: false, message: "Recipient full name is required" });

    const validStatuses = ["pending", "processing", "successful", "failed"];
    const resolvedStatus = status || "pending";
    if (!validStatuses.includes(resolvedStatus))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const user = await UserModel.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const parsedFee  = parseFloat(fee) || 0;
    const totalDebit = parseFloat((parsedAmount + parsedFee).toFixed(2));

    // Deduct balance for successful / processing
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

    // ── Build transfer data (all inline, no separate recipient doc) ──
    const transferData = {
      user:          userId,
      fullname:      fullname.trim(),
      bankname:      bankname?.trim()      || "",
      country:       country?.trim()       || "",
      iban:          iban?.trim()          || "",
      swiftcode:     swiftcode?.trim()     || "",
      accountnumber: accountnumber?.trim() || "",
      type:          type?.trim()          || "International transfer",
      amount:        parsedAmount,
      fee:           parsedFee,
      currency:      "USD",
      description:   description.trim(),
      status:        resolvedStatus,
      reference:     makeRef(),
    };

    if (createdAt) {
      const parsedDate = new Date(createdAt);
      if (!isNaN(parsedDate.getTime())) transferData.createdAt = parsedDate;
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
    });
  } catch (err) {
    console.error("adminAddWireTransfer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
