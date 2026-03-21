import UserModel from "../../models/UserModel.js";

// Update transfer permission
export const updateUserTransferPermission = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAllowedToTransfer, transferDisabledReason } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isAllowedToTransfer = isAllowedToTransfer;

    if (!isAllowedToTransfer && transferDisabledReason) {
      user.transferDisabledReason = transferDisabledReason;
    }

    if (isAllowedToTransfer) {
      user.transferDisabledReason = null;
    }

    await user.save();

    res.json({ success: true, message: "Transfer permission updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
