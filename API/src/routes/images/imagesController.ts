import { Request, Response } from "express";
import { db } from "../../db/index";
import { images } from "../../db/entities/imagesSchema";
import { eq } from "drizzle-orm";

export async function listImages(req: Request, res: Response) {
  try {
    const imageList = await db
    .select()
    .from(images);

    res.json(imageList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getImageById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, id));

    if (!image){
        res.status(404).send({message: "Image not found"});
    } else {
        res.json(image);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createImage(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [image] = await db
      .insert(images)
      .values(req.body) // Assuming req.body matches the images schema structure
      .returning();
    res.status(201).json(image);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateImage(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [image] = await db
    .update(images)
    .set(updatedFields)
    .where(eq(images.id, id))
    .returning();

    if (image) {
        res.json(image);
    } else {
        res.status(404).send({message: "Image was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteImage(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedImage] = await db
    .delete(images)
    .where(eq(images.id, id))
    .returning();

    if (deletedImage) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Image was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
