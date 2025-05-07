import { Request, Response } from "express";
import { db } from "../../db/index";
import { products } from "../../db/entities/productsSchema";
import { eq } from "drizzle-orm";

export async function listProducts(req: Request, res: Response) {
  try {
    const productList = await db
    .select()
    .from(products);

    res.json(productList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product){
        res.status(404).send({message: "Product not found"});
    } else {
        res.json(product);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const [product] = await db
      .insert(products)
      .values(req.body)
      .returning();
    res.status(201).json(product);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body;

    const [product] = await db
    .update(products)
    .set(updatedFields)
    .where(eq(products.id, id))
    .returning();

    if (product) {
        res.json(product);
    } else {
        res.status(404).send({message: "Product was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedProduct] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

    if (deletedProduct) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Product was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
