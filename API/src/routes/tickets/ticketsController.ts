import { Request, Response } from "express";
import { db } from "../../db/index";
import { tickets } from "../../db/entities/ticketsSchema";
import { eq } from "drizzle-orm";

export async function listTickets(req: Request, res: Response) {
  try {
    const ticketList = await db
    .select()
    .from(tickets);

    res.json(ticketList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getTicketById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));

    if (!ticket){
        res.status(404).send({message: "Ticket not found"});
    } else {
        res.json(ticket);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createTicket(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [ticket] = await db
      .insert(tickets)
      .values(req.body) // Assuming req.body matches the tickets schema structure
      .returning();
    res.status(201).json(ticket);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateTicket(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [ticket] = await db
    .update(tickets)
    .set(updatedFields)
    .where(eq(tickets.id, id))
    .returning();

    if (ticket) {
        res.json(ticket);
    } else {
        res.status(404).send({message: "Ticket was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteTicket(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedTicket] = await db
    .delete(tickets)
    .where(eq(tickets.id, id))
    .returning();

    if (deletedTicket) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Ticket was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
