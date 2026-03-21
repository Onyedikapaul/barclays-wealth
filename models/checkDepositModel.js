import mongoose from "mongoose";

const checkDepositSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },

    // uploaded images
    frontImageUrl: { type: String, required: true },
    backImageUrl: { type: String, required: true },
    frontPublicId: { type: String, required: true },
    backPublicId: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    note: { type: String, trim: true, default: "" },

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

export default mongoose.model("CheckDeposit", checkDepositSchema);
