import mongoose from "mongoose";

const BillPaySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    payeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payee",
      required: true,
      index: true,
    },

    // optional: store snapshot so history still makes sense even if payee changes later
    payeeSnapshot: {
      name: { type: String, trim: true },
      method: { type: String, trim: true },
      account: { type: String, trim: true },
      address1: { type: String, trim: true },
      address2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipcode: { type: String, trim: true },
    },

    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "USD" },

    deliveryDate: { type: Date, required: true },
    memo: { type: String, trim: true, maxlength: 200, default: "" },

    fee: { type: Number, default: 0 },
    totalDebit: { type: Number, required: true }, // amount + fee

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    reference: { type: String, required: true, unique: true, index: true },
    failureReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const BillPay =
  mongoose.models.BillPay || mongoose.model("BillPay", BillPaySchema);
export default BillPay;
