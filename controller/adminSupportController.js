import mongoose from "mongoose";
import SupportTicket from "../models/SupportTicketModel.js";
import UserModel from "../models/UserModel.js";


export const adminGetTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({})
      .populate("userId", "firstname middlename lastname email")
      .sort({ updatedAt: -1 })
      .lean();

    // ✅ collect missing userIds (populate returned null)
    const missingIds = tickets
      .filter(
        (t) => !t.userId && mongoose.Types.ObjectId.isValid(String(t.userId)),
      )
      .map((t) => String(t.userId));

    // NOTE: above line won't work because t.userId is null after populate
    // ✅ so read raw userId from ticket itself (before populate) isn't available now
    // BEST: store original field name in schema and access it directly:
    // We'll do a safer approach: query SupportTicket again without populate for userId list

    const rawTickets = await SupportTicket.find({})
      .select("userId")
      .sort({ updatedAt: -1 })
      .lean();

    const rawUserIds = rawTickets
      .map((t) => t.userId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const users = await UserModel.find({ _id: { $in: rawUserIds } })
      .select("firstname middlename lastname email")
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const formatted = tickets.map((t, i) => {
      // populated user (object) OR fallback user map (by id)
      const rawUserId = rawTickets[i]?.userId
        ? String(rawTickets[i].userId)
        : null;
      const u = t.userId || (rawUserId ? userMap.get(rawUserId) : null);

      return {
        _id: t._id,
        ticketId: t.ticketId,
        status: t.status,
        department: t.department,
        message: t.message ?? t.msg ?? t.text ?? "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        replies: Array.isArray(t.replies) ? t.replies : [],
        user: u
          ? {
              _id: u._id,
              firstname: u.firstname ?? "",
              middlename: u.middlename ?? "",
              lastname: u.lastname ?? "",
              email: u.email ?? "",
            }
          : {
              _id: rawUserId || null,
              firstname: "",
              middlename: "",
              lastname: "",
              email: "Unknown email",
            },
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error("adminGetTickets error:", err);
    return res.status(500).json({ message: "Failed to fetch tickets" });
  }
};
