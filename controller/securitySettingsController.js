import UserModel from "../models/UserModel.js";

// GET /api/account/security-settings
export const getSecuritySettings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(userId).select("securitySettings");
    if (!user) return res.status(404).json({ message: "User not found" });

    const settings = user.securitySettings || {};

    return res.json({
      saveActivityLogs: settings.saveActivityLogs ?? true,
      securityPinEnabled: settings.securityPinEnabled ?? true,
    });
  } catch (err) {
    console.error("getSecuritySettings error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/account/security-settings
export const updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { saveActivityLogs, securityPinEnabled } = req.body;

    // allow partial updates
    const update = {};
    if (typeof saveActivityLogs === "boolean") {
      update["securitySettings.saveActivityLogs"] = saveActivityLogs;
    }
    if (typeof securityPinEnabled === "boolean") {
      update["securitySettings.securityPinEnabled"] = securityPinEnabled;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update (use boolean values).",
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true },
    ).select("securitySettings");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      message: "Security settings updated",
      saveActivityLogs: user.securitySettings.saveActivityLogs,
      securityPinEnabled: user.securitySettings.securityPinEnabled,
    });
  } catch (err) {
    console.error("updateSecuritySettings error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};