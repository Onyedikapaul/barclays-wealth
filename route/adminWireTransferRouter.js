import express from "express";
import {
    adminAddWireTransfer,
  getUserWireTransfers,
  updateWireTransferStatus,
} from "../controller/admin/adminWireTransferController.js";
import wireTransferHistoryModel from "../models/wireTransferHistoryModel.js";

const AdminWireTransferRouter = express.Router();

// GET  /api/admin/wire-transfers/user/:userId
AdminWireTransferRouter.get("/user/:userId", getUserWireTransfers);

// PATCH /api/admin/wire-transfers/:transferId/status
AdminWireTransferRouter.patch("/:transferId/status", updateWireTransferStatus);

// POST /api/admin/wire-transfers/user/:userId/add
AdminWireTransferRouter.post("/user/:userId/add", adminAddWireTransfer);


AdminWireTransferRouter.delete("/:id", async (req, res) => {
  const tx = await wireTransferHistoryModel.findByIdAndDelete(req.params.id);
  if (!tx) return res.status(404).json({ success: false, message: "Transfer not found" });
  return res.json({ success: true, message: "Transfer deleted" });
});

export default AdminWireTransferRouter;
