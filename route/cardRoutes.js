import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { activateMyCard, getMyCards } from "../controller/cardController.js";


const CardRouter = express.Router();

CardRouter.get("/my", checkAuth, getMyCards);
CardRouter.patch("/:cardId/activate", checkAuth, activateMyCard);

export default CardRouter;