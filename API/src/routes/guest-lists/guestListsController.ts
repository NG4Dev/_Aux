import { Request, Response } from "express";
import { db } from "../../db/index";
import { guestLists } from "../../db/entities/guestListsSchema";
import { eq } from "drizzle-orm";

export async function listGuestLists(req: Request, res: Response) {
  try {
    const guestList = await db
    .select()
    .from(guestLists);

    res.json(guestList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getGuestListById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [guestList] = await db
      .select()
      .from(guestLists)
      .where(eq(guestLists.id, id));

    if (!guestList){
        res.status(404).send({message: "Guest list entry not found"});
    } else {
        res.json(guestList);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createGuestList(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [guestList] = await db
      .insert(guestLists)
      .values(req.body) // Assuming req.body matches the guestLists schema structure
      .returning();
    res.status(201).json(guestList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateGuestList(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [guestList] = await db
    .update(guestLists)
    .set(updatedFields)
    .where(eq(guestLists.id, id))
    .returning();

    if (guestList) {
        res.json(guestList);
    } else {
        res.status(404).send({message: "Guest list entry was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteGuestList(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedGuestList] = await db
    .delete(guestLists)
    .where(eq(guestLists.id, id))
    .returning();

    if (deletedGuestList) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Guest list entry was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
