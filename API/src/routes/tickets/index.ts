import { Router } from "express";
import { listTickets, getTicketById, createTicket, updateTicket, deleteTicket } from "./ticketsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listTickets as RequestHandler);
router.get("/:id", getTicketById as RequestHandler);
router.post("/", createTicket as RequestHandler);
router.put("/:id", updateTicket as RequestHandler);
router.delete("/:id", deleteTicket as RequestHandler);

export default router;
