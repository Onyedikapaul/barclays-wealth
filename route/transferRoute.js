import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import {
  confirmTransferDraft,
  createTransferDraft,
  finalizeTransferDraft,
  updateTransferDraft,
} from "../controller/transferController.js";

const TransferRouter = express.Router();

TransferRouter.post("/transfer/draft", checkAuth, createTransferDraft);
TransferRouter.patch("/transfer/draft/:id", checkAuth, updateTransferDraft);
TransferRouter.post("/transfer/confirm", checkAuth, confirmTransferDraft);
TransferRouter.post("/transfer/final", checkAuth, finalizeTransferDraft);

export default TransferRouter;
