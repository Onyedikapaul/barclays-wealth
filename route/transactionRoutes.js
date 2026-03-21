import e from "express";
import {
  createTransfer,
  getMyTransactions,
  getRecentTransactions,
  listMyTransactions,
} from "../controller/transactionController.js";
import checkAuth from "../middlewares/authMiddleware.js";
import { downloadReceiptPdf } from "../controller/downloadTransactionPdf.js";

const TransactionRouter = e.Router();

TransactionRouter.get("/transactions/recent", checkAuth, getRecentTransactions);

TransactionRouter.get("/transactions", checkAuth, listMyTransactions);

TransactionRouter.post("/transfer", checkAuth, createTransfer);

TransactionRouter.get("/transactions", checkAuth, getMyTransactions);


TransactionRouter.get("/transactions/:id/receipt.pdf", checkAuth, downloadReceiptPdf);


export default TransactionRouter;
