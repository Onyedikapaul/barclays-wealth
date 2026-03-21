import CardModel from "../models/CardModel.js";
import UserModel from "../models/UserModel.js";

export const fetchUserDashboardData = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, message: "Not authenticated" });
    }

    const userId = user._id;

    const userData = await UserModel.findById(userId).select(
      "-passwordHash -secretCodeHash"
    );

    if (!userData) {
      return res.status(404).json({ ok: false, message: "User Not Found" });
    }

      /** ✅ COUNT USER CARDS */
    const cardCount = await CardModel.countDocuments({ user: userId });

    return res.status(200).json({
      ok: true,
      user: {
        _id: userData._id,
        firstname: userData.firstname,
        middlename: userData.middlename,
        lastname: userData.lastname,

        phone: userData.phone,
        email: userData.email,
        passportUrl: userData.passportUrl,

        accounttype: userData.accounttype,
        accountNumber: userData.accountNumber,
        accountBalance: userData.accountBalance,
        isAllowedToTransfer: userData.isAllowedToTransfer,

        occupation: userData.occupation,
        income: userData.income,

        country: userData.country,
        state: userData.state,
        city: userData.city,
        zipcode: userData.zipcode,
        dob: userData.dob,
        usercurrency: userData.usercurrency,

        cardCount,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD] error:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
