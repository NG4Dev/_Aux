import { Request, Response } from "express";
import { db } from "../../db/index";
import { videos } from "../../db/entities/videosSchema";
import { eq } from "drizzle-orm";

export async function listVideos(req: Request, res: Response) {
  try {
    const videoList = await db
    .select()
    .from(videos);

    res.json(videoList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getVideoById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, id));

    if (!video){
        res.status(404).send({message: "Video not found"});
    } else {
        res.json(video);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createVideo(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [video] = await db
      .insert(videos)
      .values(req.body) // Assuming req.body matches the videos schema structure
      .returning();
    res.status(201).json(video);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateVideo(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [video] = await db
    .update(videos)
    .set(updatedFields)
    .where(eq(videos.id, id))
    .returning();

    if (video) {
        res.json(video);
    } else {
        res.status(404).send({message: "Video was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteVideo(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedVideo] = await db
    .delete(videos)
    .where(eq(videos.id, id))
    .returning();

    if (deletedVideo) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Video was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
