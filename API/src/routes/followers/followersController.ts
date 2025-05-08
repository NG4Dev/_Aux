import { Request, Response } from "express";
import { db } from "../../db/index";
import { followers } from "../../db/entities/followersSchema";
import { eq, and } from "drizzle-orm"; // Import and for composite conditions

export async function listFollowers(req: Request, res: Response) {
  try {
    const followerList = await db
    .select()
    .from(followers);

    res.json(followerList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getFollowerById(req: Request, res: Response) {
  try {
    // Note: Getting a follower by a single ID might not be sufficient
    // as the primary key is a UUID for the relationship itself.
    // You might need to query by followerId and followingUserId/followingBusinessId.
    const id = req.params.id as string;
    const [follower] = await db
      .select()
      .from(followers)
      .where(eq(followers.id, id)); // Using the relationship ID for now

    if (!follower){
        res.status(404).send({message: "Follower relationship not found"});
    } else {
        res.json(follower);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createFollower(req: Request, res: Response) {
  try {
    // Expecting req.body to contain followerId and either followingUserId or followingBusinessId
    const { followerId, followingUserId, followingBusinessId } = req.body;

    if (!followerId || (!followingUserId && !followingBusinessId)) {
        return res.status(400).send({ message: "Invalid request body" });
    }

    if (followingUserId && followingBusinessId) {
         return res.status(400).send({ message: "Cannot follow both a user and a business in one relationship" });
    }

    const [follower] = await db
      .insert(followers)
      .values({ followerId, followingUserId, followingBusinessId })
      .returning();
    res.status(201).json(follower);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteFollower(req: Request, res: Response) {
  try {
    // Note: Deleting a follower by a single ID might not be sufficient.
    // You might need to delete by followerId and followingUserId/followingBusinessId.
    const id = req.params.id as string;
    const [deletedFollower] = await db
    .delete(followers)
    .where(eq(followers.id, id)) // Using the relationship ID for now
    .returning();

    if (deletedFollower) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Follower relationship was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

// Update function is typically not needed for a simple follower relationship
// export async function updateFollower(req: Request, res: Response) { ... }
