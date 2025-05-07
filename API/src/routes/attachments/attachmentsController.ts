import { Request, Response } from "express";
import { db } from "../../db/index";
import { attachments } from "../../db/entities/attachmentsSchema";
import { eq } from "drizzle-orm";

export async function listAttachments(req: Request, res: Response) {
  try {
    const attachmentList = await db
    .select()
    .from(attachments);

    res.json(attachmentList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getAttachmentById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id));

    if (!attachment){
        res.status(404).send({message: "Attachment not found"});
    } else {
        res.json(attachment);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createAttachment(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [attachment] = await db
      .insert(attachments)
      .values(req.body) // Assuming req.body matches the attachments schema structure
      .returning();
    res.status(201).json(attachment);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateAttachment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [attachment] = await db
    .update(attachments)
    .set(updatedFields)
    .where(eq(attachments.id, id))
    .returning();

    if (attachment) {
        res.json(attachment);
    } else {
        res.status(404).send({message: "Attachment was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteAttachment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedAttachment] = await db
    .delete(attachments)
    .where(eq(attachments.id, id))
    .returning();

    if (deletedAttachment) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Attachment was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
