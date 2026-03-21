import mongoose from "mongoose";

const TicketReplySchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["customer", "admin"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const SupportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Customer Services Department",
        "Account Department",
        "Transfer Department",
        "Card Services Department",
        "Loan Department",
        "Bank Deposit Department",
      ],
    },

    message: { type: String, required: true, trim: true, maxlength: 2000 },

    status: {
      type: String,
      enum: ["open", "pending", "closed"],
      default: "open",
      index: true,
    },

    replies: { type: [TicketReplySchema], default: [] },
  },
  { timestamps: true },
);

// ✅ IMPORTANT: use normal function, not arrow, so "this" works
SupportTicketSchema.pre("save", function () {
  if (this.ticketId) return;

  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  this.ticketId = `TCK-${y}${m}${d}-${rand}`;
});

const SupportTicket = mongoose.model("SupportTicket", SupportTicketSchema);
export default SupportTicket;
