import { Request, Response } from "express";
import { db } from "../../db/index";
import { eventCategories } from "../../db/entities/eventCategoriesSchema"; // Import eventCategories schema
import { eq } from "drizzle-orm"; // Import eq

export async function listEventCategories(req: Request, res: Response) {
  try {
    const eventCategoryList = await db
    .select()
    .from(eventCategories);

    res.json(eventCategoryList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getEventCategoryById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [eventCategory] = await db
      .select()
      .from(eventCategories)
      .where(eq(eventCategories.id, id));

    if (!eventCategory){
        res.status(404).send({message: "Event category not found"});
    } else {
        res.json(eventCategory);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createEventCategory(req: Request, res: Response) {
  try {
    // Expecting req.body to contain businessId and name, and optionally description
    const { businessId, name, description } = req.body;

    if (!businessId || !name) {
        return res.status(400).send({ message: "Business ID and name are required" });
    }

    const [eventCategory] = await db
      .insert(eventCategories)
      .values({ businessId, name, description })
      .returning();
    res.status(201).json(eventCategory);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateEventCategory(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [eventCategory] = await db
    .update(eventCategories)
    .set(updatedFields)
    .where(eq(eventCategories.id, id))
    .returning();

    if (eventCategory) {
        res.json(eventCategory);
    } else {
        res.status(404).send({message: "Event category was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteEventCategory(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedEventCategory] = await db
    .delete(eventCategories)
    .where(eq(eventCategories.id, id))
    .returning();

    if (deletedEventCategory) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Event category was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
