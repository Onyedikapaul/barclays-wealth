import mongoose from "mongoose";
import UserModel from "../../models/UserModel.js";

export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // 2️⃣ Find and delete
    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      ok: true,
      message: "User deleted successfully",
      userId: id,
    });
  } catch (err) {
    console.error("deleteAdminUser error:", err);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};
