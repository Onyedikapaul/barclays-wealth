import express from "express";
import { sendAdminEmail } from "../controller/adminEmailController.js";

const AdminEmailRouter = express.Router();

AdminEmailRouter.post("/email", sendAdminEmail);

export default AdminEmailRouter;