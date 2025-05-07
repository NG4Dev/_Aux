import { Request, Response } from "express";
import { db } from "../../db/index";
import { posts } from "../../db/entities/postsSchema";
import { eq } from "drizzle-orm";

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
    // Basic validation/typing might be needed for req.body
    const [post] = await db
      .insert(posts)
      .values(req.body) // Assuming req.body matches the posts schema structure
      .returning();
    res.status(201).json(post);
  } catch (e) {
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
