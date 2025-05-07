import { Router } from "express";
import { listTicketResales, getTicketResaleById, createTicketResale, updateTicketResale, deleteTicketResale } from "./ticketResalesController";

const router = Router();

router.get("/", listTicketResales);
router.get("/:id", getTicketResaleById);
router.post("/", createTicketResale);
router.put("/:id", updateTicketResale);
router.delete("/:id", deleteTicketResale);

export default router;
