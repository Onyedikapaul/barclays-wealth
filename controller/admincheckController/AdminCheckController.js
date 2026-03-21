import checkDepositModel from "../../models/checkDepositModel.js";

export const getAllCheckDeposits = async (req, res) => {
  try {
    const deposits = await checkDepositModel.find({})
      .sort({ createdAt: -1 })
      .populate("user", "firstname lastname email accountNumber")
      .select(
        "_id amount currency status note reference frontImageUrl backImageUrl createdAt",
      )
      .lean();

    return res.json({ ok: true, deposits });
  } catch (err) {
    console.error("getAllCheckDeposits error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
