import e from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import {
  listAllTickets,
  replyTicket,
} from "../controller/adminTicketController.js";

const AdminTicketRouter = e.Router();

AdminTicketRouter.get("/", checkAuth, listAllTickets);
AdminTicketRouter.post("/:ticketId/reply", checkAuth, replyTicket);

export default AdminTicketRouter;
