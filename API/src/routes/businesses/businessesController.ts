import { Request, Response } from "express";
import { db } from "../../db/index";
import { businesses } from "../../db/entities/businessesSchema";
import { eq } from "drizzle-orm";

export async function listBusinesses(req: Request, res: Response) {
  try {
    const businessList = await db
    .select()
    .from(businesses);

    res.json(businessList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getBusinessById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id));

    if (!business){
        res.status(404).send({message: "Business not found"});
    } else {
        res.json(business);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createBusiness(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [business] = await db
      .insert(businesses)
      .values(req.body) // Assuming req.body matches the business schema structure
      .returning();
    res.status(201).json(business);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateBusiness(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [business] = await db
    .update(businesses)
    .set(updatedFields)
    .where(eq(businesses.id, id))
    .returning();

    if (business) {
        res.json(business);
    } else {
        res.status(404).send({message: "Business was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteBusiness(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedBusiness] = await db
    .delete(businesses)
    .where(eq(businesses.id, id))
    .returning();

    if (deletedBusiness) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Business was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
