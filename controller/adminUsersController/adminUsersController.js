import mongoose from "mongoose";
import UserModel from "../../models/UserModel.js";
import resend from "../../lib/resend.js";
import { accountStatusEmailTemplate } from "../../lib/accountStatusEmailTemplate.js";

const pickUser = (u) => ({
  _id: u._id,
  firstname: u.firstname,
  middlename: u.middlename,
  lastname: u.lastname,
  transactionPin: u.transactionPin,
  passwordHash: u.passwordHash, 
  email: u.email,
  phone: u.phone,
  dob: u.dob,
  address: u.address,
  country: u.country,
  state: u.state,
  city: u.city,
  zipcode: u.zipcode,
  occupation: u.occupation,
  income: u.income,
  ssn: u.ssn,
  accounttype: u.accounttype,
  usercurrency: u.usercurrency,
  accountNumber: u.accountNumber,
  accountBalance: u.accountBalance,
  isAllowedToTransfer: u.isAllowedToTransfer,
  transferDisabledReason: u.transferDisabledReason,
  status: u.status,
  suspensionReason: u.suspensionReason,
  passportUrl: u.passportUrl,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export const adminGetUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const user = await UserModel.findById(id).lean();
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    return res.json({ ok: true, user: pickUser(user) });
  } catch (err) {
    console.error("adminGetUserById error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const adminUpdateUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user id" });
    }

    const user = await UserModel.findById(id);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    const prevStatus = String(user.status || "active").toLowerCase();

    // ✅ whitelist fields allowed from your edit form
    const allowed = [
      "firstname",
      "middlename",
      "lastname",
      "passwordHash",
      "transactionPin",
      "country",
      "state",
      "city",
      "zipcode",
      "dob",
      "address",
      "phone",
      "email",
      "occupation",
      "income",
      "ssn",
      "accounttype",
      "usercurrency",
      "accountNumber",
      "accountBalance",
      "isAllowedToTransfer",
      "status",
      "suspensionReason",
      "transferDisabledReason",
    ];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        user[key] = req.body[key];
      }
    }

    // normalize
    if (typeof user.email === "string")
      user.email = user.email.trim().toLowerCase();
    if (typeof user.usercurrency === "string")
      user.usercurrency = user.usercurrency.trim().toUpperCase();

    // number validation
    if (req.body.accountBalance !== undefined) {
      const n = Number(req.body.accountBalance);
      if (!Number.isFinite(n)) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "accountBalance must be a valid number",
          });
      }
      user.accountBalance = n;
    }

    // status rules
    const newStatus = String(user.status || "active").toLowerCase();
    if (!["active", "suspended", "closed"].includes(newStatus)) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    if (newStatus === "suspended") {
      const reason = String(user.suspensionReason || "").trim();
      if (!reason) {
        return res.status(400).json({
          ok: false,
          message: "Suspension reason is required when status is suspended.",
        });
      }
      user.suspensionReason = reason;
    } else {
      // keep clean for active/closed
      if (newStatus !== "suspended") user.suspensionReason = null;
    }

    await user.save();

    // ✅ Send email ONLY if status changed to suspended/closed
    if (
      newStatus !== prevStatus &&
      (newStatus === "suspended" || newStatus === "closed")
    ) {
      try {
        const name =
          `${user.firstname || ""} ${user.lastname || ""}`.trim() || "Customer";
        const html = accountStatusEmailTemplate({
          name,
          status: newStatus,
          reason: newStatus === "suspended" ? user.suspensionReason : "",
          supportEmail: "info@bw-web-ing-uk.pro",
        });

        const subject =
          newStatus === "suspended"
            ? "Account Suspended | Barclays Wealth"
            : "Account Closed | Barclays Wealth";

        await resend.emails.send({
          from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
          to: user.email,
          subject,
          html,
        });
      } catch (e) {
        console.error("adminUpdateUserById status email error:", e);
        // don’t fail the update because email failed
      }
    }

    return res.json({
      ok: true,
      message: "User updated",
      user: pickUser(user),
    });
  } catch (err) {
    console.error("adminUpdateUserById error:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: "Duplicate conflict (email/accountNumber already exists)",
      });
    }

    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
