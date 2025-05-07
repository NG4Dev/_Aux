import { Router } from "express";
import { listTickets, getTicketById, createTicket, updateTicket, deleteTicket } from "./ticketsController";

const router = Router();

router.get("/", listTickets);
router.get("/:id", getTicketById);
router.post("/", createTicket);
router.put("/:id", updateTicket);
router.delete("/:id", deleteTicket);

export default router;
