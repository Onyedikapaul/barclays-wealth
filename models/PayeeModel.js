import mongoose from "mongoose";

const PayeeSchema = new mongoose.Schema(
  {
    // who owns this payee
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // form fields
    name: { type: String, required: true, trim: true, maxlength: 120 },

    method: {
      type: String,
      required: true,
      trim: true,
      enum: ["Paper Check"], // add more later if you support them
      default: "Paper Check",
    },

    account: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 64,
    },

    address1: { type: String, required: true, trim: true, maxlength: 200 },
    address2: { type: String, trim: true, maxlength: 200, default: "" },

    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },

    zipcode: { type: String, required: true, trim: true, maxlength: 20 },

    nickname: { type: String, trim: true, maxlength: 80, default: "" },

    favorite: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// prevent duplicates per user (same name + account)
PayeeSchema.index({ userId: 1, name: 1, account: 1 }, { unique: true });

const Payee = mongoose.models.Payee || mongoose.model("Payee", PayeeSchema);
export default Payee;
