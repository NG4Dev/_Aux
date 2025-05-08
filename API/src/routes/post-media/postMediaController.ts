import { Request, Response } from "express";
import { db } from "../../db/index";
import { postMedia } from "../../db/entities/postMediaSchema"; // Import postMedia schema
import { eq } from "drizzle-orm"; // Import eq

export async function listPostMedia(req: Request, res: Response) {
  try {
    const postMediaList = await db
    .select()
    .from(postMedia);

    res.json(postMediaList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getPostMediaById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [postMediaItem] = await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.id, id));

    if (!postMediaItem){
        res.status(404).send({message: "Post media item not found"});
    } else {
        res.json(postMediaItem);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createPostMedia(req: Request, res: Response) {
  try {
    // Expecting req.body to contain postId, order, and one of imageId, videoId, or musicUrl
    const { postId, imageId, videoId, musicUrl, order } = req.body;

    if (!postId || order === undefined || (!imageId && !videoId && !musicUrl)) {
        return res.status(400).send({ message: "Invalid request body" });
    }

    if ((imageId && videoId) || (imageId && musicUrl) || (videoId && musicUrl)) {
         return res.status(400).send({ message: "Cannot link to more than one media type in a single post media item" });
    }


    const [postMediaItem] = await db
      .insert(postMedia)
      .values({ postId, imageId, videoId, musicUrl, order })
      .returning();
    res.status(201).json(postMediaItem);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updatePostMedia(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [postMediaItem] = await db
    .update(postMedia)
    .set(updatedFields)
    .where(eq(postMedia.id, id))
    .returning();

    if (postMediaItem) {
        res.json(postMediaItem);
    } else {
        res.status(404).send({message: "Post media item was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deletePostMedia(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedPostMediaItem] = await db
    .delete(postMedia)
    .where(eq(postMedia.id, id))
    .returning();

    if (deletedPostMediaItem) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Post media item was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
