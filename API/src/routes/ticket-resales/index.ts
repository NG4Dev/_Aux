import { Router } from "express";
import { listTicketResales, getTicketResaleById, createTicketResale, updateTicketResale, deleteTicketResale } from "./ticketResalesController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listTicketResales as RequestHandler);
router.get("/:id", getTicketResaleById as RequestHandler);
router.post("/", createTicketResale as RequestHandler);
router.put("/:id", updateTicketResale as RequestHandler);
router.delete("/:id", deleteTicketResale as RequestHandler);

export default router;
