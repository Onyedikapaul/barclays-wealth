import mongoose from "mongoose";

const wireTransferSchema = new mongoose.Schema(
  {
    // (Optional but recommended) who created this transfer/recipient
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // Location
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    zipcode: { type: String, trim: true, default: "" },

    // Contact
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/,
        "Invalid email format",
      ],
    },
    phone: { type: String, trim: true, default: "" },

    // Recipient
    fullname: { type: String, required: true, trim: true },

    // Transfer type
    type: {
      type: String,
      trim: true,
      default: "International transfer",
      enum: ["International transfer"],
    },

    // Bank details
    iban: { type: String, trim: true, default: "" }, // EU
    swiftcode: { type: String, trim: true, default: "" },
    accountnumber: { type: String, trim: true, default: "" }, // US / Others

    accountholder: { type: String, trim: true, default: "" },
    accounttype: { type: String, trim: true, default: "" },
    bankname: { type: String, trim: true, default: "" },

    // Admin / processing states (recommended)
    status: {
      type: String,
      enum: ["pending", "processing", "successful", "failed"],
      default: "pending",
      index: true,
    },

    // Optional reference for tracking
    reference: { type: String, trim: true, unique: true, sparse: true },
  },
  { timestamps: true },
);

export default mongoose.model("WireTransfer", wireTransferSchema);
