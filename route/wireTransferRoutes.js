import e from "express";
import { createWireRecipient, getRecipients, getWireTransferHistory, processWireTransfer } from "../controller/wireTransferController.js";
import checkAuth from "../middlewares/authMiddleware.js";
import { downloadWireReceiptPdf } from "../controller/downloadWireReceiptPdf.js";

const WireTransferRouter = e.Router();

WireTransferRouter.post("/recipient", checkAuth, createWireRecipient);

WireTransferRouter.get("/recipients", checkAuth, getRecipients);

// PROCESS TRANSFER
WireTransferRouter.post("/process", checkAuth, processWireTransfer);

WireTransferRouter.get("/history", checkAuth, getWireTransferHistory);

WireTransferRouter.get("/:id/receipt.pdf", checkAuth, downloadWireReceiptPdf);


export default WireTransferRouter;
