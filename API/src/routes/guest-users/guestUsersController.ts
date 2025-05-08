import { Request, Response } from "express";
import { db } from "../../db/index";
import { guestUsers } from "../../db/entities/guestUserSchema"; // Import guestUsers schema
import { eq } from "drizzle-orm"; // Import eq

export async function listGuestUsers(req: Request, res: Response) {
  try {
    const guestUserList = await db
    .select()
    .from(guestUsers);

    res.json(guestUserList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getGuestUserById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [guestUser] = await db
      .select()
      .from(guestUsers)
      .where(eq(guestUsers.id, id));

    if (!guestUser){
        res.status(404).send({message: "Guest user not found"});
    } else {
        res.json(guestUser);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createGuestUser(req: Request, res: Response) {
  try {
    // Expecting req.body to contain emailAddress and potentially isOnboarded
    const { emailAddress, isOnboarded } = req.body;

    if (!emailAddress) {
        return res.status(400).send({ message: "Email address is required" });
    }

    const [guestUser] = await db
      .insert(guestUsers)
      .values({ emailAddress, isOnboarded })
      .returning();
    res.status(201).json(guestUser);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateGuestUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [guestUser] = await db
    .update(guestUsers)
    .set(updatedFields)
    .where(eq(guestUsers.id, id))
    .returning();

    if (guestUser) {
        res.json(guestUser);
    } else {
        res.status(404).send({message: "Guest user was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteGuestUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedGuestUser] = await db
    .delete(guestUsers)
    .where(eq(guestUsers.id, id))
    .returning();

    if (deletedGuestUser) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Guest user was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
