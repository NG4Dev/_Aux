import { Request, Response } from "express";
import { db } from "../../db/index";
import { posts } from "../../db/entities/postsSchema";
import { eq } from "drizzle-orm";
import { images } from "../../db/entities/imagesSchema";
import { videos } from "../../db/entities/videosSchema";
import { postMedia } from "../../db/entities/postMediaSchema";

export async function listPosts(req: Request, res: Response) {
  try {
    const postList = await db
    .select()
    .from(posts);

    res.json(postList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getPostById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));

    if (!post){
        res.status(404).send({message: "Post not found"});
    } else {
        res.json(post);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createPost(req: Request, res: Response) {
  try {
    // Expecting req.body to contain post data and a 'media' array
    const { userId, businessId, caption, media } = req.body;

    if (!userId || !businessId) {
        return res.status(400).send({ message: "userId and businessId are required" });
    }

    // 1. Create the post record
    const [newPost] = await db
      .insert(posts)
      .values({ userId, businessId, caption })
      .returning();

    if (!newPost) {
        return res.status(500).send({ message: "Failed to create post" });
    }

    // 2. Handle media items
    if (media && Array.isArray(media)) {
      for (const mediaItem of media) {
        const { type, url, blurHash, firstFrameUrl, musicUrl, order } = mediaItem;

        let imageId = undefined;
        let videoId = undefined;

        if (type === 'image' && url) {
          // Create image record
          const [newImage] = await db.insert(images).values({ ownerId: userId, businessId: businessId, url, blurHash }).returning();
          if (newImage) {
            imageId = newImage.id;
          }
        } else if (type === 'video' && url) {
          // Create video record
          const [newVideo] = await db.insert(videos).values({ ownerId: userId, businessId: businessId, url, firstFrameUrl, blurHash }).returning();
           if (newVideo) {
            videoId = newVideo.id;
          }
        }

        // Create postMedia record
        if (imageId || videoId || musicUrl) {
             await db.insert(postMedia).values({
                postId: newPost.id,
                imageId: imageId,
                videoId: videoId,
                musicUrl: musicUrl,
                order: order // Assuming order is provided and is a number
             }).execute(); // Use execute() as returning() might not be needed here
        } else {
            console.warn("Skipping media item due to missing type/url or musicUrl:", mediaItem);
        }
      }
    }

    res.status(201).json(newPost);
  } catch (e) {
    console.error("Error creating post with media:", e);
    res.status(500).send(e);
  }
}

export async function updatePost(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [post] = await db
    .update(posts)
    .set(updatedFields)
    .where(eq(posts.id, id))
    .returning();

    if (post) {
        res.json(post);
    } else {
        res.status(404).send({message: "Post was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedPost] = await db
    .delete(posts)
    .where(eq(posts.id, id))
    .returning();

    if (deletedPost) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Post was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
