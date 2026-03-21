import e from "express";
import { verifyTurnstileEndpoint } from "../controller/CaptchaController.js";

const CaptchaRouter = e.Router();

CaptchaRouter.post("/verify-turnstile", verifyTurnstileEndpoint);

export default CaptchaRouter;