import UserModel from "../../models/UserModel.js";
import Transaction from "../../models/TransactionModel.js";
import mongoose from "mongoose";
import checkDepositModel from "../../models/checkDepositModel.js";
import resend from "../../lib/resend.js";
import { checkApprovedEmailTemplate } from "../../lib/checkApprovedEmailTemplate.js";

function genRef() {
  return "CHK-" + Date.now();
}

export const approveCheckDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const deposit = await checkDepositModel.findById(id).session(session);
    if (!deposit)
      return res.status(404).json({ ok: false, message: "Deposit not found" });

    if (deposit.status !== "pending")
      return res.status(400).json({ ok: false, message: "Already processed" });

    const user = await UserModel.findById(deposit.user).session(session);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    user.accountBalance += deposit.amount;
    await user.save({ session });

    await Transaction.create(
      [
        {
          user: user._id,
          ref: genRef(),
          type: "credit",
          scope: "local",
          title: "Check Deposit",
          amount: deposit.amount,
          currency: deposit.currency,
          narration: `Check deposit approved (${deposit.reference || "no-ref"})`,
          status: "success",
          done: true,
        },
      ],
      { session },
    );

    deposit.status = "approved";
    await deposit.save({ session });

    await session.commitTransaction();


       // ✅ Send email AFTER commit (don’t block approval if email fails)
    try {
      const html = checkApprovedEmailTemplate({
        name: `${user.firstname} ${user.lastname}`.trim(),
        amount: deposit.amount,
        currency: deposit.currency,
        reference: deposit.reference || "",
        accountNumber: user.accountNumber || "",
      });

      await resend.emails.send({
        from: "Barclays Wealth <info@bw-web-ing-uk.pro>",
        to: user.email,
        subject: "Check Deposit Approved | Barclays Wealth",
        html,
      });
    } catch (e) {
      console.error("approveCheckDeposit email error:", e);
    }

    res.json({ ok: true, message: "Check deposit approved" });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ ok: false, message: "Approval failed" });
  } finally {
    session.endSession();
  }
};
