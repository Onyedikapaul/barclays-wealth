import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true, trim: true },
    middlename: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },

    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    zipcode: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    address: { type: String, required: true, trim: true },

    phone: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    occupation: { type: String, required: true },
    income: { type: String, required: true },

    ssn: { type: String, required: true, trim: true },
    accounttype: { type: String, required: true },
    usercurrency: { type: String, default: "USD" },

    /** ✅ NEW FIELDS **/
    accountNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    accountBalance: {
      type: Number,
      default: 0,
    },

    transactionPin: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
    },

    transactionPinSet: { type: Boolean, default: false },

    isAllowedToTransfer: {
      type: Boolean,
      default: true,
    },
    // Add these two fields anywhere in your schema:

    transferDisabledReason: {
      type: String,
      default: null,
    },

    suspensionReason: {
      type: String,
      default: null,
    },

    secretCodeHash: { type: String, required: true }, // store hashed
    passwordHash: { type: String, required: true }, // store hashed

    passportUrl: { type: String, required: true },
    passportPublicId: { type: String, required: true },

    securitySettings: {
      saveActivityLogs: { type: Boolean, default: true },
      securityPinEnabled: { type: Boolean, default: true },
    },

    emailVerified: { type: Boolean, default: false },

    emailVerifyCodeHash: { type: String, default: null },
    emailVerifyCodeExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
