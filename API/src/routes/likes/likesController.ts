import { Request, Response } from "express";
import { db } from "../../db/index";
import { likes } from "../../db/entities/likesSchema";
import { eq } from "drizzle-orm";

export async function listLikes(req: Request, res: Response) {
  try {
    const likeList = await db
    .select()
    .from(likes);

    res.json(likeList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getLikeById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [like] = await db
      .select()
      .from(likes)
      .where(eq(likes.id, id));

    if (!like){
        res.status(404).send({message: "Like not found"});
    } else {
        res.json(like);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createLike(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [like] = await db
      .insert(likes)
      .values(req.body) // Assuming req.body matches the likes schema structure
      .returning();
    res.status(201).json(like);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateLike(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [like] = await db
    .update(likes)
    .set(updatedFields)
    .where(eq(likes.id, id))
    .returning();

    if (like) {
        res.json(like);
    } else {
        res.status(404).send({message: "Like was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteLike(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedLike] = await db
    .delete(likes)
    .where(eq(likes.id, id))
    .returning();

    if (deletedLike) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Like was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
