import { Request, Response } from "express";
import { db } from "../../db/index";
import { messages } from "../../db/entities/messagesSchema";
import { eq } from "drizzle-orm";

export async function listMessages(req: Request, res: Response) {
  try {
    const messageList = await db
    .select()
    .from(messages);

    res.json(messageList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getMessageById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));

    if (!message){
        res.status(404).send({message: "Message not found"});
    } else {
        res.json(message);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createMessage(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [message] = await db
      .insert(messages)
      .values(req.body) // Assuming req.body matches the messages schema structure
      .returning();
    res.status(201).json(message);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateMessage(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [message] = await db
    .update(messages)
    .set(updatedFields)
    .where(eq(messages.id, id))
    .returning();

    if (message) {
        res.json(message);
    } else {
        res.status(404).send({message: "Message was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteMessage(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedMessage] = await db
    .delete(messages)
    .where(eq(messages.id, id))
    .returning();

    if (deletedMessage) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Message was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
