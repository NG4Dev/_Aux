import { Request, Response } from "express";
import { db } from "../../db/index";
import { conversations } from "../../db/entities/conversationsSchema";
import { eq } from "drizzle-orm";

export async function listConversations(req: Request, res: Response) {
  try {
    const conversationList = await db
    .select()
    .from(conversations);

    res.json(conversationList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getConversationById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation){
        res.status(404).send({message: "Conversation not found"});
    } else {
        res.json(conversation);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createConversation(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [conversation] = await db
      .insert(conversations)
      .values(req.body) // Assuming req.body matches the conversations schema structure
      .returning();
    res.status(201).json(conversation);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateConversation(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [conversation] = await db
    .update(conversations)
    .set(updatedFields)
    .where(eq(conversations.id, id))
    .returning();

    if (conversation) {
        res.json(conversation);
    } else {
        res.status(404).send({message: "Conversation was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteConversation(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedConversation] = await db
    .delete(conversations)
    .where(eq(conversations.id, id))
    .returning();

    if (deletedConversation) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Conversation was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
