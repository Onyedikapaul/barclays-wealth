import mongoose from "mongoose";

const CardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    accountNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    cardType: {
      type: String,
      enum: ["virtual", "physical"],
      default: "virtual",
    },

    status: {
      type: String,
      enum: ["inactive", "active", "blocked"],
      default: "inactive",
      index: true,
    },

    brand: {
      type: String,
      enum: ["VISA", "MASTERCARD", "VERVE"],
      default: "VISA",
    },

    last4: { type: String, minlength: 4, maxlength: 4, required: true },
    expMonth: { type: Number, min: 1, max: 12, required: true },
    expYear: { type: Number, min: 2000, max: 2100, required: true },

    cardRef: { type: String, unique: true, index: true },

    // optional plain token if you want
    token: { type: String, default: "" },

    // optional default flag per user (you enforce in controller)
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

CardSchema.pre("validate", async function () {
  if (!this.cardRef) {
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    this.cardRef = `CARD-${rand}`;
  }

  if (!this.last4) {
    this.last4 = String(Math.floor(1000 + Math.random() * 9000));
  }

  if (!this.expMonth || !this.expYear) {
    const now = new Date();
    this.expMonth = this.expMonth || now.getMonth() + 1;
    this.expYear = this.expYear || now.getFullYear() + 3;
  }
});

const Card = mongoose.model("Card", CardSchema);
export default Card;
