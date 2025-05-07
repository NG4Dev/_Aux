import { Request, Response } from "express";
import { db } from "../../db/index";
import { ticketResales } from "../../db/entities/ticketResalesSchema";
import { eq } from "drizzle-orm";

export async function listTicketResales(req: Request, res: Response) {
  try {
    const ticketResaleList = await db
    .select()
    .from(ticketResales);

    res.json(ticketResaleList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getTicketResaleById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [ticketResale] = await db
      .select()
      .from(ticketResales)
      .where(eq(ticketResales.id, id));

    if (!ticketResale){
        res.status(404).send({message: "Ticket resale not found"});
    } else {
        res.json(ticketResale);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createTicketResale(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [ticketResale] = await db
      .insert(ticketResales)
      .values(req.body) // Assuming req.body matches the ticketResales schema structure
      .returning();
    res.status(201).json(ticketResale);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateTicketResale(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [ticketResale] = await db
    .update(ticketResales)
    .set(updatedFields)
    .where(eq(ticketResales.id, id))
    .returning();

    if (ticketResale) {
        res.json(ticketResale);
    } else {
        res.status(404).send({message: "Ticket resale was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteTicketResale(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedTicketResale] = await db
    .delete(ticketResales)
    .where(eq(ticketResales.id, id))
    .returning();

    if (deletedTicketResale) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Ticket resale was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
