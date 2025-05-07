import { Request, Response } from "express";
import { db } from "../../db/index";
import { comments } from "../../db/entities/commentsSchema";
import { eq } from "drizzle-orm";

export async function listComments(req: Request, res: Response) {
  try {
    const commentList = await db
    .select()
    .from(comments);

    res.json(commentList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getCommentById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    if (!comment){
        res.status(404).send({message: "Comment not found"});
    } else {
        res.json(comment);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [comment] = await db
      .insert(comments)
      .values(req.body) // Assuming req.body matches the comments schema structure
      .returning();
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateComment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [comment] = await db
    .update(comments)
    .set(updatedFields)
    .where(eq(comments.id, id))
    .returning();

    if (comment) {
        res.json(comment);
    } else {
        res.status(404).send({message: "Comment was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedComment] = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning();

    if (deletedComment) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Comment was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
