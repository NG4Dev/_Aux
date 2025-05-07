import { Request, Response } from "express";
import { db } from "../../db/index";
import { ticketOrders } from "../../db/entities/ticketOrdersSchema";
import { eq } from "drizzle-orm";

export async function listTicketOrders(req: Request, res: Response) {
  try {
    const ticketOrderList = await db
    .select()
    .from(ticketOrders);

    res.json(ticketOrderList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getTicketOrderById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [ticketOrder] = await db
      .select()
      .from(ticketOrders)
      .where(eq(ticketOrders.id, id));

    if (!ticketOrder){
        res.status(404).send({message: "Ticket order not found"});
    } else {
        res.json(ticketOrder);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createTicketOrder(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [ticketOrder] = await db
      .insert(ticketOrders)
      .values(req.body) // Assuming req.body matches the ticketOrders schema structure
      .returning();
    res.status(201).json(ticketOrder);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateTicketOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [ticketOrder] = await db
    .update(ticketOrders)
    .set(updatedFields)
    .where(eq(ticketOrders.id, id))
    .returning();

    if (ticketOrder) {
        res.json(ticketOrder);
    } else {
        res.status(404).send({message: "Ticket order was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteTicketOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedTicketOrder] = await db
    .delete(ticketOrders)
    .where(eq(ticketOrders.id, id))
    .returning();

    if (deletedTicketOrder) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Ticket order was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
