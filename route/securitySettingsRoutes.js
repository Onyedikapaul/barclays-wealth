import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { getSecuritySettings, updateSecuritySettings } from "../controller/securitySettingsController.js";


const SecuritySettingsRouter = express.Router();

SecuritySettingsRouter.get("/security-settings", checkAuth, getSecuritySettings);
SecuritySettingsRouter.patch("/security-settings", checkAuth, updateSecuritySettings);

export default SecuritySettingsRouter;
