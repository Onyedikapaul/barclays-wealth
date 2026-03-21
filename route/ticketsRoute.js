import e from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import {
  createTicket,
  getMyTickets,
  getOneTicket,
} from "../controller/ticketController.js";

const TicketRouter = e.Router();

TicketRouter.post("/create", checkAuth, createTicket);
TicketRouter.get("/mine", checkAuth, getMyTickets);
TicketRouter.get("/:ticketId", checkAuth, getOneTicket);

export default TicketRouter;
