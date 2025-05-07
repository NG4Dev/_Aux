import { Request, Response } from "express";
import { db } from "../../db/index";
import { subscriptions } from "../../db/entities/subscriptionsSchema";
import { eq } from "drizzle-orm";

export async function listSubscriptions(req: Request, res: Response) {
  try {
    const subscriptionList = await db
    .select()
    .from(subscriptions);

    res.json(subscriptionList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getSubscriptionById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    if (!subscription){
        res.status(404).send({message: "Subscription not found"});
    } else {
        res.json(subscription);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createSubscription(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [subscription] = await db
      .insert(subscriptions)
      .values(req.body) // Assuming req.body matches the subscriptions schema structure
      .returning();
    res.status(201).json(subscription);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateSubscription(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [subscription] = await db
    .update(subscriptions)
    .set(updatedFields)
    .where(eq(subscriptions.id, id))
    .returning();

    if (subscription) {
        res.json(subscription);
    } else {
        res.status(404).send({message: "Subscription was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteSubscription(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedSubscription] = await db
    .delete(subscriptions)
    .where(eq(subscriptions.id, id))
    .returning();

    if (deletedSubscription) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Subscription was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
