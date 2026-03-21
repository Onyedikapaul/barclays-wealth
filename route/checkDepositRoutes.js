import e from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { submitCheckDeposit } from "../controller/checkDepositController.js";
import upload from "../middlewares/uploadMemory.js";

const CheckDepositRouter = e.Router();

CheckDepositRouter.post(
  "/submit",
  checkAuth,
  upload.fields([
    { name: "fileToUpload", maxCount: 1 }, // front
    { name: "back", maxCount: 1 }, // back
  ]),
  submitCheckDeposit,
);

export default CheckDepositRouter;
