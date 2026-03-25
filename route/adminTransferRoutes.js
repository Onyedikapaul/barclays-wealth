import express from "express";
import { adminCreditUser } from "../controller/adminTransferController.js";
import TransactionModel from "../models/TransactionModel.js";

const AdminCreditUserRouter = express.Router();

// POST /api/admin/transfer/credit
AdminCreditUserRouter.post("/transfer/credit", adminCreditUser);

AdminCreditUserRouter.delete("/transactions/:id", async (req, res) => {
  const tx = await TransactionModel.findByIdAndDelete(req.params.id);
  if (!tx) return res.status(404).json({ ok: false, message: "Transaction not found" });
  return res.json({ ok: true, message: "Transaction deleted" });
});

export default AdminCreditUserRouter;
