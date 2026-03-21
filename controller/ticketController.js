import SupportTicket from "../models/SupportTicketModel.js";


export const createTicket = async (req, res) => {
  try {
    const userId = req.user?._id; // from auth middleware
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { department, message } = req.body;

    if (!department) return res.status(400).json({ message: "Department is required" });
    if (!message || String(message).trim().length < 5)
      return res.status(400).json({ message: "Message must be at least 5 characters" });

    const ticket = await SupportTicket.create({
      userId,
      department,
      message: String(message).trim(),
      status: "open",
      replies: [
        { sender: "customer", message: String(message).trim() }, // first message stored as a reply too
      ],
    });

    return res.status(201).json({
      message: "Ticket created",
      ticketId: ticket.ticketId,
      ticket: {
        ticketId: ticket.ticketId,
        department: ticket.department,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (err) {
    console.error("createTicket error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/tickets/mine
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const tickets = await SupportTicket.find({ userId })
      .sort({ createdAt: -1 })
      .select("ticketId department status createdAt updatedAt replies");

    // build response for your table (comments = replies count - 1)
    const data = tickets.map((t) => ({
      ticketId: t.ticketId,
      department: t.department,
      status: t.status,
      createdAt: t.createdAt,
      commentsCount: Math.max(0, (t.replies?.length || 0) - 1),
    }));

    return res.json({ tickets: data });
  } catch (err) {
    console.error("getMyTickets error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/tickets/:ticketId  (customer view)
export const getOneTicket = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({ ticketId, userId }).select(
      "ticketId department status message replies createdAt updatedAt"
    );

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    return res.json({ ticket });
  } catch (err) {
    console.error("getOneTicket error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
