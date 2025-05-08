import { Request, Response } from "express";
import { db } from "../../db/index";
import { productCategories } from "../../db/entities/productCategoriesSchema"; // Import productCategories schema
import { eq } from "drizzle-orm"; // Import eq

export async function listProductCategories(req: Request, res: Response) {
  try {
    const productCategoryList = await db
    .select()
    .from(productCategories);

    res.json(productCategoryList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getProductCategoryById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [productCategory] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));

    if (!productCategory){
        res.status(404).send({message: "Product category not found"});
    } else {
        res.json(productCategory);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createProductCategory(req: Request, res: Response) {
  try {
    // Expecting req.body to contain businessId and name, and optionally description
    const { businessId, name, description } = req.body;

    if (!businessId || !name) {
        return res.status(400).send({ message: "Business ID and name are required" });
    }

    const [productCategory] = await db
      .insert(productCategories)
      .values({ businessId, name, description })
      .returning();
    res.status(201).json(productCategory);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateProductCategory(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [productCategory] = await db
    .update(productCategories)
    .set(updatedFields)
    .where(eq(productCategories.id, id))
    .returning();

    if (productCategory) {
        res.json(productCategory);
    } else {
        res.status(404).send({message: "Product category was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteProductCategory(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedProductCategory] = await db
    .delete(productCategories)
    .where(eq(productCategories.id, id))
    .returning();

    if (deletedProductCategory) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Product category was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
