import { Router } from "express";
import { listTicketOrders, getTicketOrderById, createTicketOrder, updateTicketOrder, deleteTicketOrder } from "./ticketOrdersController";

const router = Router();

router.get("/", listTicketOrders);
router.get("/:id", getTicketOrderById);
router.post("/", createTicketOrder);
router.put("/:id", updateTicketOrder);
router.delete("/:id", deleteTicketOrder);

export default router;
