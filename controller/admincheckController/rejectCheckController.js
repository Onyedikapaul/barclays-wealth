import UserModel from "../../models/UserModel.js";
import resend from "../../lib/resend.js";
import { rejectionEmailTemplate } from "../../lib/rejectionEmailTemplate.js";
import checkDepositModel from "../../models/checkDepositModel.js";
import TransactionModel from "../../models/TransactionModel.js";


function genRef() {
  return "CHK-" + Date.now();
}

export const rejectCheckDeposit = async (req, res) => {
  try {
    const { id } = req.params;

    const deposit = await checkDepositModel.findById(id);
    if (!deposit)
      return res.status(404).json({ ok: false, message: "Deposit not found" });

    if (deposit.status !== "pending")
      return res.status(400).json({ ok: false, message: "Already processed" });

    const user = await UserModel.findById(deposit.user);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    await TransactionModel.create({
      user: user._id,
      ref: genRef(),
      type: "credit",
      scope: "local",
      title: "Check Deposit Rejected",
      amount: deposit.amount,
      currency: deposit.currency,
      narration: `Rejected check deposit (${deposit.reference || "no-ref"})`,
      status: "failed",
      done: true,
    });

    deposit.status = "rejected";
    await deposit.save();

    await resend.emails.send({
      from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
      to: user.email,
      subject: "Check Deposit Rejected",
      html: rejectionEmailTemplate({
        name: user.firstname,
        amount: deposit.amount,
        currency: deposit.currency,
        reference: deposit.reference,
      }),
    });

    res.json({ ok: true, message: "Deposit rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Rejection failed" });
  }
};
