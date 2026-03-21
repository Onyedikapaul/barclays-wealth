import SupportTicket from "../models/SupportTicketModel.js";

// GET /api/admin/tickets
export const listAllTickets = async (req, res) => {
  try {
    // assume admin auth middleware already checked
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "fullname email") // adjust to your User fields
      .select("ticketId department status createdAt updatedAt userId");

    return res.json({ tickets });
  } catch (err) {
    console.error("listAllTickets error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/tickets/:ticketId/reply
export const replyTicket = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.user?._id || null; // depends how you store admin

    const { ticketId } = req.params;
    const { message, status } = req.body;

    if (!message || String(message).trim().length < 2)
      return res.status(400).json({ message: "Reply message is required" });

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.replies.push({
      sender: "admin",
      message: String(message).trim(),
      adminId,
    });

    // optional status update
    if (status && ["open", "pending", "closed"].includes(status)) {
      ticket.status = status;
    } else {
      // if admin replies, move open -> pending automatically
      if (ticket.status === "open") ticket.status = "pending";
    }

    await ticket.save();

    return res.json({
      message: "Replied",
      ticketId: ticket.ticketId,
      status: ticket.status,
    });
  } catch (err) {
    console.error("replyTicket error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
