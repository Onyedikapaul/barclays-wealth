import express from "express";
import {
    adminAddWireTransfer,
  getUserWireTransfers,
  updateWireTransferStatus,
} from "../controller/admin/adminWireTransferController.js";

const AdminWireTransferRouter = express.Router();

// GET  /api/admin/wire-transfers/user/:userId
AdminWireTransferRouter.get("/user/:userId", getUserWireTransfers);

// PATCH /api/admin/wire-transfers/:transferId/status
AdminWireTransferRouter.patch("/:transferId/status", updateWireTransferStatus);

// POST /api/admin/wire-transfers/user/:userId/add
AdminWireTransferRouter.post("/user/:userId/add", adminAddWireTransfer);

export default AdminWireTransferRouter;
