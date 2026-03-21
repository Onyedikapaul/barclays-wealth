import mongoose from "mongoose";
import Card from "../models/CardModel.js";

/**
 * GET /api/cards/my?accountNumber=...
 * Returns all cards for logged-in user (or filter by accountNumber)
 */
export const getMyCards = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { accountNumber } = req.query;

    const filter = { userId };
    if (accountNumber) filter.accountNumber = String(accountNumber).trim();

    const cards = await Card.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "userId accountNumber cardType status brand last4 expMonth expYear cardRef token isDefault createdAt updatedAt",
      )
      .lean();

    return res.json({ ok: true, cards });
  } catch (err) {
    console.error("getMyCards error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

/**
 * PATCH /api/cards/:cardId/activate
 * Activates a card that belongs to the logged-in user
 */
export const activateMyCard = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { cardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: "Invalid card id" });
    }

    const card = await Card.findOne({ _id: cardId, userId });
    if (!card) return res.status(404).json({ message: "Card not found" });

    if (card.status === "blocked") {
      return res.status(403).json({ message: "Card is blocked" });
    }

    if (card.status === "active") {
      return res.json({ ok: true, message: "Card already active", card });
    }

    card.status = "active";
    await card.save();

    return res.json({ ok: true, message: "Card activated", card });
  } catch (err) {
    console.error("activateMyCard error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
