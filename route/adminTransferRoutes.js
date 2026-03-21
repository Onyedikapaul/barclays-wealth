import express from "express";
import { adminCreditUser } from "../controller/adminTransferController.js";

const AdminCreditUserRouter = express.Router();

// POST /api/admin/transfer/credit
AdminCreditUserRouter.post("/transfer/credit", adminCreditUser);

export default AdminCreditUserRouter;
