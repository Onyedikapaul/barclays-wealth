import Payee from "../models/PayeeModel.js";

/**
 * @desc   Create a new payee
 * @route  POST /api/payees
 * @access Private
 */
export const createPayee = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const {
      name,
      method,
      account,
      address1,
      address2,
      city,
      state,
      zipcode,
      nickname,
      favorite,
    } = req.body;

    // ---- basic validation ----
    if (!name || !account || !address1 || !city || !state || !zipcode) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    // ---- check duplicate ----
    const exists = await Payee.findOne({
      userId,
      name,
      account,
    });

    if (exists) {
      return res.status(409).json({
        message: "This payee already exists",
      });
    }

    const payee = await Payee.create({
      userId,
      name: name.trim(),
      method: method || "Paper Check",
      account: account.trim(),
      address1: address1.trim(),
      address2: address2?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      zipcode: zipcode.trim(),
      nickname: nickname?.trim() || "",
      favorite: Boolean(favorite),
    });

    return res.status(201).json({
      message: "Payee added successfully",
      payee,
    });
  } catch (err) {
    console.error("Create Payee Error:", err);

    // Mongo duplicate key safety net
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate payee detected",
      });
    }

    return res.status(500).json({
      message: "Server error. Please try again",
    });
  }
};
