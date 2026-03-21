// import mongoose from "mongoose";
// import wireTransferHistoryModel from "../models/wireTransferHistoryModel.js";
// import wireTransferModel from "../models/wireTransferModel.js";
// import UserModel from "../models/UserModel.js";

// export const createWireRecipient = async (req, res) => {
//   try {
//     const {
//       country,
//       state,
//       city,
//       address,
//       zipcode,
//       email,
//       phone,
//       fullname,
//       type,
//       iban,
//       swiftcode,
//       accountnumber,
//       accountholder,
//       accounttype,
//       bankname,
//     } = req.body;

//     // Basic required validations (based on your frontend required fields)
//     if (!country || !state || !city || !fullname) {
//       return res.status(400).json({
//         success: false,
//         message: "country, state, city, and fullname are required",
//       });
//     }

//     // Create document
//     const doc = await wireTransferModel.create({
//       user: req.user?._id, // if auth exists, else undefined
//       country,
//       state,
//       city,
//       address,
//       zipcode,
//       email,
//       phone,
//       fullname,
//       type: type || "International transfer",
//       iban,
//       swiftcode,
//       accountnumber,
//       accountholder,
//       accounttype,
//       bankname,
//       status: "pending",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Recipient created successfully",
//       data: doc,
//     });
//   } catch (err) {
//     // Handle duplicate reference if you later add one
//     const msg =
//       err?.code === 11000
//         ? "Duplicate value error"
//         : err?.message || "Server error";

//     return res.status(500).json({
//       success: false,
//       message: msg,
//     });
//   }
// };

// export const getRecipients = async (req, res) => {
//   try {
//     const recipients = await wireTransferModel
//       .find({ user: req.user._id })
//       .sort({ createdAt: -1 })
//       .select(
//         "fullname bankname country city state iban swiftcode accountnumber createdAt",
//       );

//     return res.json({
//       success: true,
//       message: "Recipients fetched",
//       data: recipients,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err?.message || "Server error",
//     });
//   }
// };

// // helper to generate reference
// function makeRef(prefix = "WT") {
//   return `${prefix}-${Date.now()}-${Math.random()
//     .toString(16)
//     .slice(2, 8)
//     .toUpperCase()}`;
// }

// export const processWireTransfer = async (req, res) => {
//   try {
//     const { recipient, amount, dated, description, transactionPin } = req.body;

//     if (!recipient) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Recipient is required" });
//     }

//     const amt = Number(amount);
//     if (!amt || amt <= 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Amount must be greater than 0" });
//     }

//     if (!description || !String(description).trim()) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Description (reason) is required" });
//     }

//     if (!transactionPin || !String(transactionPin).trim()) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Transaction PIN is required" });
//     }

//     let deliveryDate;
//     if (dated) {
//       deliveryDate = new Date(dated);
//       if (isNaN(deliveryDate.getTime())) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid delivery date" });
//       }
//     }

//     // 1) Ensure recipient exists and belongs to this user
//     const foundRecipient = await wireTransferModel.findOne({
//       _id: recipient,
//       user: req.user._id,
//     });

//     if (!foundRecipient) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Recipient not found" });
//     }

//     // 2) Load user and validate pin + allowed
//     const user = await UserModel.findById(req.user._id);
//     if (!user)
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });

//     if (!user.isAllowedToTransfer) {
//       return res.status(403).json({
//         success: false,
//         message:
//           `Transaction Error:  Reason: ${user.transferDisabledReason}` ||
//           "Transfers are not allowed on your account",
//       });
//     }

//     if (user.status !== "active") {
//       return res.status(403).json({
//         ok: false,
//         message: `Your account is suspended, Reason: ${user.suspensionReason || "We found suspicious activities on your account  and have temporarily suspended it for your protection. Please contact support for more information."}`,
//       });
//     }

//     // PIN check (your current is plain text compare)
//     const pinOk = String(transactionPin) === String(user.transactionPin);
//     if (!pinOk) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Incorrect transaction PIN" });
//     }

//     // 3) Atomic debit (only if balance is enough)
//     // 3) Calculate 2% platform fee
//     const FEE_PERCENT = 2;

//     const fee = Number(((amt * FEE_PERCENT) / 100).toFixed(2));
//     const totalDebit = Number((amt + fee).toFixed(2));

//     // 4) Atomic debit (only if balance is enough)
//     const updatedUser = await UserModel.findOneAndUpdate(
//       {
//         _id: req.user._id,
//         isAllowedToTransfer: true,
//         accountBalance: { $gte: totalDebit },
//       },
//       { $inc: { accountBalance: -totalDebit } },
//       { new: true },
//     );

//     if (!updatedUser) {
//       // fetch balance for message (no update)
//       const currentUser = await UserModel.findById(req.user._id).select(
//         "accountBalance",
//       );

//       return res.status(400).json({
//         success: false,
//         message: `Insufficient balance. Available balance: $${Number(
//           currentUser?.accountBalance || 0,
//         ).toFixed(2)}`,
//       });
//     }

//     // 4) Save history
//     const history = await wireTransferHistoryModel.create({
//       user: req.user._id,
//       recipient: foundRecipient._id,
//       amount: amt,
//       currency: updatedUser.usercurrency || "USD",
//       deliveryDate,
//       description: String(description).trim(),
//       fee,
//       status: "successful",
//       reference: makeRef("WIRE"),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Transfer successful and saved to history",
//       data: history,
//       newBalance: updatedUser.accountBalance,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err?.message || "Server error",
//     });
//   }
// };

// export const getWireTransferHistory = async (req, res) => {
//   try {
//     const history = await wireTransferHistoryModel
//       .find({ user: req.user._id })
//       .sort({ createdAt: -1 })
//       .populate("recipient", "fullname bankname country") // recipient details
//       .select(
//         "reference createdAt amount currency description fee status recipient",
//       );

//     return res.json({
//       success: true,
//       message: "History fetched",
//       data: history,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err?.message || "Server error",
//     });
//   }
// };


import mongoose from "mongoose";
import wireTransferHistoryModel from "../models/wireTransferHistoryModel.js";
import wireTransferModel from "../models/wireTransferModel.js";
import UserModel from "../models/UserModel.js";

export const createWireRecipient = async (req, res) => {
  try {
    const {
      country, state, city, address, zipcode,
      email, phone, fullname, type,
      iban, swiftcode, accountnumber,
      accountholder, accounttype, bankname,
    } = req.body;

    if (!country || !fullname) {
      return res.status(400).json({
        success: false,
        message: "Country and fullname are required",
      });
    }

    const doc = await wireTransferModel.create({
      user:          req.user?._id,
      country,       state,         city,
      address,       zipcode,       email,
      phone,         fullname,
      type:          type || "International transfer",
      iban,          swiftcode,     accountnumber,
      accountholder, accounttype,   bankname,
    });

    return res.status(201).json({
      success: true,
      message: "Recipient saved successfully",
      data: doc,
    });
  } catch (err) {
    const msg = err?.code === 11000
      ? "Duplicate value error"
      : err?.message || "Server error";
    return res.status(500).json({ success: false, message: msg });
  }
};

export const getRecipients = async (req, res) => {
  try {
    const recipients = await wireTransferModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select(
        "fullname bankname country city state address zipcode email phone iban swiftcode accountnumber accountholder accounttype createdAt"
      );

    return res.json({
      success: true,
      message: "Recipients fetched",
      data: recipients,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
};

function makeRef(prefix = "WT") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

export const processWireTransfer = async (req, res) => {
  try {
    const {
      recipient, amount, description, transactionPin,
      // inline recipient fields (if no saved recipient selected)
      country, state, city, address, zipcode,
      email, phone, fullname, type,
      iban, swiftcode, accountnumber,
      accountholder, accounttype, bankname,
    } = req.body;

    const amt = Number(amount);
    if (!amt || amt <= 0)
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });

    if (!description?.trim())
      return res.status(400).json({ success: false, message: "Description is required" });

    if (!transactionPin?.toString().trim())
      return res.status(400).json({ success: false, message: "Transaction PIN is required" });

    if (!fullname)
      return res.status(400).json({ success: false, message: "Recipient full name is required" });

    // ── Load user ──
    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // ── Account status check ──
    if (user.accountStatus === "suspended" || user.accountStatus === "closed") {
      return res.status(403).json({
        success: false,
        message: `Your account has been ${user.accountStatus}. ${
          user.suspensionReason ? `Reason: ${user.suspensionReason}` : "Please contact support."
        }`,
      });
    }

    // ── Transfer permission check ──
    if (!user.isAllowedToTransfer) {
      return res.status(403).json({
        success: false,
        message: user.blockedTransferReason || "Transfers are not allowed on your account. Please contact support.",
      });
    }

    // ── PIN check ──
    if (!user.transactionPin)
      return res.status(400).json({ success: false, message: "No transaction PIN set. Please set one in settings." });

    if (String(transactionPin) !== String(user.transactionPin))
      return res.status(400).json({ success: false, message: "Incorrect transaction PIN" });

    // ── Resolve recipient ──
    // If a saved recipient ID was passed, use it; otherwise use inline fields
    let recipientDoc = null;

    if (recipient && mongoose.Types.ObjectId.isValid(recipient)) {
      recipientDoc = await wireTransferModel.findOne({
        _id: recipient,
        user: req.user._id,
      });
    }

    // If no saved recipient found/selected, create a temporary one from inline fields
    if (!recipientDoc) {
      recipientDoc = await wireTransferModel.create({
        user:          req.user._id,
        country:       country || "",
        state:         state   || "",
        city:          city    || "",
        address:       address || "",
        zipcode:       zipcode || "",
        email:         email   || "",
        phone:         phone   || "",
        fullname,
        type:          type    || "International transfer",
        iban:          iban    || "",
        swiftcode:     swiftcode    || "",
        accountnumber: accountnumber || "",
        accountholder: accountholder || "",
        accounttype:   accounttype   || "",
        bankname:      bankname      || "",
      });
    }

    // ── Fee + total calculation ──
    const FEE_PERCENT  = 2;
    const fee          = Number(((amt * FEE_PERCENT) / 100).toFixed(2));
    const totalDebit   = Number((amt + fee).toFixed(2));

    // ── Atomic balance deduct ──
    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id:                req.user._id,
        isAllowedToTransfer: true,
        accountBalance:            { $gte: totalDebit },
      },
      { $inc: { accountBalance: -totalDebit } },
      { new: true },
    );

    if (!updatedUser) {
      const currentUser = await UserModel.findById(req.user._id).select("accountBalance");
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${Number(currentUser?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      });
    }

    // ── Save history ──
    const history = await wireTransferHistoryModel.create({
      user:        req.user._id,
      recipient:   recipientDoc._id,
      amount:      amt,
      currency:    updatedUser.usercurrency || "USD",
      description: String(description).trim(),
      fee,
      status:      "successful",
      reference:   makeRef("WIRE"),
    });

    return res.status(201).json({
      success:    true,
      message:    `Transfer of $${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })} submitted successfully.`,
      data:       history,
      newBalance: updatedUser.balance,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};

export const getWireTransferHistory = async (req, res) => {
  try {
    const history = await wireTransferHistoryModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("recipient", "fullname bankname country")
      .select("reference createdAt amount currency description fee status recipient");

    return res.json({ success: true, message: "History fetched", data: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
};