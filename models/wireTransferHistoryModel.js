import mongoose from "mongoose";

const wireTransferHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // ── Recipient info (stored inline, no separate recipient doc) ──
    fullname: { type: String, trim: true },
    country: { type: String, trim: true },
    bankname: { type: String, trim: true },
    accountnumber: { type: String, trim: true },
    swiftcode: { type: String, trim: true },
    iban: { type: String, trim: true },
    type: { type: String, trim: true, default: "International transfer" },

    // ── Transfer details ──
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "successful", "failed"],
      default: "pending",
      index: true,
    },

    reference: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("WireTransferHistory", wireTransferHistorySchema);
