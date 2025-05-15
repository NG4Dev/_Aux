import { Request, Response } from "express";
import { db } from "../../db/index";
import { businesses } from "../../db/entities/businessesSchema";
import { guestUsers } from "../../db/entities/guestUserSchema";
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
    // Expecting req.body to contain business details and the guestUserId
    const { guestUserId, name, description, category, email, tagline, tradingHours, address, phoneNumber, logoUrl } = req.body;

    if (!guestUserId || !name || !email) {
        return res.status(400).send({ message: "guestUserId, name, and email are required" });
    }

    // Check if the guest user exists
    const [guestUser] = await db.select().from(guestUsers).where(eq(guestUsers.id, guestUserId));
    if (!guestUser) {
        return res.status(404).send({ message: "Guest user not found" });
    }

    // 1. Create the business record
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        ownerId: guestUserId, // Link to the guest user who created it
        name,
        description,
        category,
        email,
        tagline,
        tradingHours,
        address,
        phoneNumber,
        logoUrl,
        // userId will be set later when the real user account is created
      })
      .returning();

    if (!newBusiness) {
        return res.status(500).send({ message: "Failed to create business" });
    }

    // 2. Update the guest user's isOnboarded status
    await db.update(guestUsers)
      .set({ isOnboarded: true })
      .where(eq(guestUsers.id, guestUserId))
      .execute();

    res.status(201).json(newBusiness);
  } catch (e) {
    console.error("Error creating business:", e);
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
