import checkDepositModel from "../models/checkDepositModel.js";
import { uploadBufferToCloudinary } from "../utils/ploadToCloudinary.js";
import { makeTxRef } from "../utils/ref.js";

export const submitCheckDeposit = async (req, res) => {
  try {
    const amt = Number(req.body.amount);

    if (!amt || amt <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0" });
    }

    const front = req.files?.fileToUpload?.[0];
    const back = req.files?.back?.[0];

    if (!front) {
      return res
        .status(400)
        .json({ success: false, message: "Front of check image is required" });
    }
    if (!back) {
      return res
        .status(400)
        .json({ success: false, message: "Back of check image is required" });
    }

    // ✅ Upload both images to Cloudinary
    let frontUp, backUp;
    try {
      [frontUp, backUp] = await Promise.all([
        uploadBufferToCloudinary(
          front.buffer,
          "atlas-heritage/check-deposits/front",
        ),
        uploadBufferToCloudinary(
          back.buffer,
          "atlas-heritage/check-deposits/back",
        ),
      ]);
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }

    const frontImageUrl = frontUp.secure_url;
    const backImageUrl = backUp.secure_url;

    const frontPublicId = frontUp.public_id;
    const backPublicId = backUp.public_id;

    const deposit = await checkDepositModel.create({
      user: req.user._id,
      amount: amt,
      currency: "USD",
      frontImageUrl,
      backImageUrl,
      frontPublicId,
      backPublicId,
      status: "pending",
      reference: makeTxRef("CHK"),
    });

    return res.status(201).json({
      success: true,
      message: "Check deposit submitted successfully. Awaiting approval.",
      data: deposit,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
};
