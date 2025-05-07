import { Request, Response } from "express";
import { db } from "../../db/index";
import { events } from "../../db/entities/eventsSchema";
import { eq } from "drizzle-orm";

export async function listEvents(req: Request, res: Response) {
  try {
    const eventList = await db
    .select()
    .from(events);

    res.json(eventList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getEventById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));

    if (!event){
        res.status(404).send({message: "Event not found"});
    } else {
        res.json(event);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createEvent(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [event] = await db
      .insert(events)
      .values(req.body) // Assuming req.body matches the events schema structure
      .returning();
    res.status(201).json(event);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateEvent(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [event] = await db
    .update(events)
    .set(updatedFields)
    .where(eq(events.id, id))
    .returning();

    if (event) {
        res.json(event);
    } else {
        res.status(404).send({message: "Event was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteEvent(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedEvent] = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning();

    if (deletedEvent) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Event was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
