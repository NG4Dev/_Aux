import { Request, Response } from "express";
import { db } from "../../db/index";
import { stories } from "../../db/entities/storiesSchema";
import { eq } from "drizzle-orm";

export async function listStories(req: Request, res: Response) {
  try {
    const storyList = await db
    .select()
    .from(stories);

    res.json(storyList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getStoryById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, id));

    if (!story){
        res.status(404).send({message: "Story not found"});
    } else {
        res.json(story);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createStory(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [story] = await db
      .insert(stories)
      .values(req.body) // Assuming req.body matches the stories schema structure
      .returning();
    res.status(201).json(story);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateStory(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [story] = await db
    .update(stories)
    .set(updatedFields)
    .where(eq(stories.id, id))
    .returning();

    if (story) {
        res.json(story);
    } else {
        res.status(404).send({message: "Story was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteStory(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedStory] = await db
    .delete(stories)
    .where(eq(stories.id, id))
    .returning();

    if (deletedStory) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Story was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
