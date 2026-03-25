import e from "express";
import { getWireTransferHistory, processWireTransfer, sendWireOtp } from "../controller/wireTransferController.js";
import checkAuth from "../middlewares/authMiddleware.js";
import { downloadWireReceiptPdf } from "../controller/downloadWireReceiptPdf.js";

const WireTransferRouter = e.Router();

// PROCESS TRANSFER
WireTransferRouter.post("/process", checkAuth, processWireTransfer);

WireTransferRouter.get("/history", checkAuth, getWireTransferHistory);

WireTransferRouter.post("/send-otp", checkAuth, sendWireOtp);

WireTransferRouter.get("/:id/receipt.pdf", checkAuth, downloadWireReceiptPdf);


export default WireTransferRouter;
