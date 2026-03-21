import mongoose from "mongoose";

const wireTransferHistorySchema = new mongoose.Schema(
  {
    // who made the transfer (optional but recommended)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // link to saved recipient (WireTransfer)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WireTransfer",
      required: true,
      index: true,
    },

    // transfer details
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

    deliveryDate: {
      type: Date,
      required: false,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    // fees (optional)
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // status tracking
    status: {
      type: String,
      enum: ["pending", "processing", "successful", "failed"],
      default: "pending",
      index: true,
    },

    // reference tracking (optional but useful)
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
