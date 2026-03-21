import express from "express";
import { adminLogin, adminLogout, adminMe } from "../controller/adminAuthController.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";


const AdminAuthRouter = express.Router();

AdminAuthRouter.post("/login", adminLogin);
AdminAuthRouter.post("/logout", adminLogout);
AdminAuthRouter.get("/me", requireAdmin, adminMe);

export default AdminAuthRouter;