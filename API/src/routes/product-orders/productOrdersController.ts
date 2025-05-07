import { Request, Response } from "express";
import { db } from "../../db/index";
import { productOrders } from "../../db/entities/productOrdersSchema";
import { eq } from "drizzle-orm";

export async function listProductOrders(req: Request, res: Response) {
  try {
    const productOrderList = await db
    .select()
    .from(productOrders);

    res.json(productOrderList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getProductOrderById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [productOrder] = await db
      .select()
      .from(productOrders)
      .where(eq(productOrders.id, id));

    if (!productOrder){
        res.status(404).send({message: "Product order not found"});
    } else {
        res.json(productOrder);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createProductOrder(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [productOrder] = await db
      .insert(productOrders)
      .values(req.body) // Assuming req.body matches the productOrders schema structure
      .returning();
    res.status(201).json(productOrder);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateProductOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [productOrder] = await db
    .update(productOrders)
    .set(updatedFields)
    .where(eq(productOrders.id, id))
    .returning();

    if (productOrder) {
        res.json(productOrder);
    } else {
        res.status(404).send({message: "Product order was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteProductOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedProductOrder] = await db
    .delete(productOrders)
    .where(eq(productOrders.id, id))
    .returning();

    if (deletedProductOrder) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Product order was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
