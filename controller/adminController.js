import mongoose from "mongoose";
import UserModel from "../models/UserModel.js";
import jwt from "jsonwebtoken";

// ✅ GET all users (safe fields only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({})
      .select(
        "firstname middlename lastname email isAllowedToTransfer createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateTransferPermission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { isAllowedToTransfer, transferDisabledReason } = req.body;

    // strict boolean check
    if (typeof isAllowedToTransfer !== "boolean") {
      return res
        .status(400)
        .json({ message: "isAllowedToTransfer must be true or false" });
    }

    // Build update payload
    const update = { isAllowedToTransfer: isAllowedToTransfer };

    if (isAllowedToTransfer === false) {
      const reason = String(transferDisabledReason || "").trim();

      if (!reason) {
        return res.status(400).json({
          message:
            "transferDisabledReason is required when disabling transfers",
        });
      }

      update.transferDisabledReason = reason;
      update.transferDisabledAt = new Date(); // optional (if you add this field)
    } else {
      // enabling => clear old reason
      update.transferDisabledReason = "";
      update.transferDisabledAt = null; // optional (if you add this field)
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).select(
      "firstname middlename lastname email isAllowedToTransfer transferDisabledReason transferDisabledAt",
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Transfer permission updated",
      user: updated,
    });
  } catch (err) {
    console.error("updateTransferPermission error:", err);
    return res.status(500).json({ message: "Failed to update permission" });
  }
};

export const adminLoginAsUser = async (req, res) => {
  try {
    // ---- OPTION B: quick protection (use env ADMIN_KEY) ----
    // If you already have adminAuth middleware, REMOVE this block and protect via middleware instead.
    // const adminKey = req.headers["x-admin-key"];
    // if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }
    // // -------------------------------------------------------

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await UserModel.findById(id).select("_id email").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ your exact token structure
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ your exact cookie settings
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      userId: user._id,
      redirectTo: "/en/account/myaccount/onlineacces",
    });
  } catch (err) {
    console.error("adminLoginAsUser error:", err);
    return res.status(500).json({ message: "Failed to login as user" });
  }
};
