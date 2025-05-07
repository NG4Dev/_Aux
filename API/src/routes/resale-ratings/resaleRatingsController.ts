import { Request, Response } from "express";
import { db } from "../../db/index";
import { resaleRatings } from "../../db/entities/resaleRatingsSchema";
import { eq } from "drizzle-orm";

export async function listResaleRatings(req: Request, res: Response) {
  try {
    const resaleRatingList = await db
    .select()
    .from(resaleRatings);

    res.json(resaleRatingList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getResaleRatingById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [resaleRating] = await db
      .select()
      .from(resaleRatings)
      .where(eq(resaleRatings.id, id));

    if (!resaleRating){
        res.status(404).send({message: "Resale rating not found"});
    } else {
        res.json(resaleRating);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createResaleRating(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [resaleRating] = await db
      .insert(resaleRatings)
      .values(req.body) // Assuming req.body matches the resaleRatings schema structure
      .returning();
    res.status(201).json(resaleRating);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateResaleRating(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [resaleRating] = await db
    .update(resaleRatings)
    .set(updatedFields)
    .where(eq(resaleRatings.id, id))
    .returning();

    if (resaleRating) {
        res.json(resaleRating);
    } else {
        res.status(404).send({message: "Resale rating was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteResaleRating(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedResaleRating] = await db
    .delete(resaleRatings)
    .where(eq(resaleRatings.id, id))
    .returning();

    if (deletedResaleRating) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Resale rating was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
