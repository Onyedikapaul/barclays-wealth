import express from "express";
import { createPayee } from "../controller/PayeeModel.js";
import checkAuth from "../middlewares/authMiddleware.js";


const PayeeRouter = express.Router();

// create payee
PayeeRouter.post("/", checkAuth, createPayee);

export default PayeeRouter;
