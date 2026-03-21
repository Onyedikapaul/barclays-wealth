import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { createBillPay, getBillPayHistory, getMyPayees } from "../controller/billPayController.js";

const BillPayRouter = express.Router();

// payee dropdown data
BillPayRouter.get("/payees", checkAuth, getMyPayees);

// create bill payment
BillPayRouter.post("/", checkAuth, createBillPay);

// history
BillPayRouter.get("/history", checkAuth, getBillPayHistory);

export default BillPayRouter;
