import { Request, Response } from "express";
import { db } from "../../db/index";
import { users } from "../../db/entities/usersSchema";
import { eq } from "drizzle-orm";

export async function listUsers(req: Request, res: Response) {
  try {
    const userList = await db
    .select()
    .from(users);

    res.json(userList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user){
        res.status(404).send({message: "User not found"});
    } else {
        res.json(user);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [user] = await db
      .insert(users)
      .values(req.body) // Assuming req.body matches the user schema structure
      .returning();
    res.status(201).json(user);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [user] = await db
    .update(users)
    .set(updatedFields)
    .where(eq(users.id, id))
    .returning();

    if (user) {
        res.json(user);
    } else {
        res.status(404).send({message: "User was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

    if (deletedUser) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "User was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
