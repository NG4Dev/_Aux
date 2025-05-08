import { Router } from "express";
import { listTicketOrders, getTicketOrderById, createTicketOrder, updateTicketOrder, deleteTicketOrder } from "./ticketOrdersController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listTicketOrders as RequestHandler);
router.get("/:id", getTicketOrderById as RequestHandler);
router.post("/", createTicketOrder as RequestHandler);
router.put("/:id", updateTicketOrder as RequestHandler);
router.delete("/:id", deleteTicketOrder as RequestHandler);

export default router;
