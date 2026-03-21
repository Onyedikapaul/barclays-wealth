import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    ref: { type: String, required: true, unique: true, index: true },

    type: { type: String, enum: ["credit", "debit"], required: true },
    scope: {
      type: String,
      enum: ["internal", "local", "wire"],
      default: "local",
    },

    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    beneficiary: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
    },

    narration: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "otp_required",
        "success",
        "failed",
        "reversed",
      ],
      default: "draft",
    },
    done: {
      type: Boolean,
      default: false,
    },

    // ✅ NEW: admin safe adjustments (prevents double-refund)
    adjustment: {
      refunded: { type: Boolean, default: false },
      refundedAt: { type: Date },
      // refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // optional
      note: { type: String, default: "" },
      prevStatus: { type: String, default: "" },
    },

    transferOtpHash: { type: String, default: "" },
    transferOtpExpiresAt: { type: Date, default: null },
    transferOtpSentAt: { type: Date, default: null },
    transferOtpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Transaction", transactionSchema);
