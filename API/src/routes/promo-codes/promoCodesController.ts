import { Request, Response } from "express";
import { db } from "../../db/index";
import { promoCodes } from "../../db/entities/promoCodesSchema";
import { eq } from "drizzle-orm";

export async function listPromoCodes(req: Request, res: Response) {
  try {
    const promoCodeList = await db
    .select()
    .from(promoCodes);

    res.json(promoCodeList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getPromoCodeById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id));

    if (!promoCode){
        res.status(404).send({message: "Promo code not found"});
    } else {
        res.json(promoCode);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createPromoCode(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [promoCode] = await db
      .insert(promoCodes)
      .values(req.body) // Assuming req.body matches the promoCodes schema structure
      .returning();
    res.status(201).json(promoCode);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updatePromoCode(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [promoCode] = await db
    .update(promoCodes)
    .set(updatedFields)
    .where(eq(promoCodes.id, id))
    .returning();

    if (promoCode) {
        res.json(promoCode);
    } else {
        res.status(404).send({message: "Promo code was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deletePromoCode(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedPromoCode] = await db
    .delete(promoCodes)
    .where(eq(promoCodes.id, id))
    .returning();

    if (deletedPromoCode) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Promo code was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
