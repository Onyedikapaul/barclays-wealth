import checkDepositModel from "../../models/checkDepositModel.js";
import cloudinary from "../../config/cloudinary.js";

export const deleteCheckDeposit = async (req, res) => {
  try {
    const { id } = req.params;

    const check = await checkDepositModel
      .findById(id)
      .select("frontPublicId backPublicId");

    if (!check) {
      return res.status(404).json({ ok: false, message: "Deposit not found" });
    }

    // delete images first
    await cloudinary.uploader.destroy(check.frontPublicId).catch(() => {});
    await cloudinary.uploader.destroy(check.backPublicId).catch(() => {});

    // then delete record
    await checkDepositModel.findByIdAndDelete(id);

    res.json({ ok: true, message: "Deposit deleted" });
  } catch (err) {
    console.error("deleteCheckDeposit error:", err);
    res.status(500).json({ ok: false, message: "Delete failed" });
  }
};
