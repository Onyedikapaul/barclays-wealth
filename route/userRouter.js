import e from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controller/userController.js";
import checkAuth from "../middlewares/authMiddleware.js"; 
import { fetchUserDashboardData } from "../controller/dashboardController.js";
import { verifyEmail } from "../controller/VerifyEmailController.js";
import { setTransactionPin } from "../controller/setTransactionPinController.js";
import { resendVerificationCode } from "../controller/resendVerificationCode.js";
import upload from "../middlewares/uploadMemory.js";
import { userResetTransactionPin } from "../controller/userResetPinController.js";
import { submitContactMessage } from "../controller/userContactController.js";

const UserRouter = e.Router();

UserRouter.post("/register", upload.single("passport"), registerUser);

UserRouter.post("/login", loginUser);

UserRouter.post("/logout", logoutUser);

UserRouter.get("/check-auth", checkAuth, (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Authenticated",
    userId: req.user._id,
  });
});

UserRouter.get("/dashboard", checkAuth, fetchUserDashboardData);

UserRouter.post("/set-transaction-pin", setTransactionPin);

UserRouter.post("/verify-email", verifyEmail);

UserRouter.post("/resend-verification-code", resendVerificationCode);

UserRouter.patch("/user/reset-transaction-pin", checkAuth, userResetTransactionPin);

UserRouter.post("/contact", submitContactMessage);

export default UserRouter;
