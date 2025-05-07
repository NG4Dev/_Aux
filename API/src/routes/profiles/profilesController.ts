import { Request, Response } from "express";
import { db } from "../../db/index";
import { profiles } from "../../db/entities/profilesSchema";
import { eq } from "drizzle-orm";

export async function listProfiles(req: Request, res: Response) {
  try {
    const profileList = await db
    .select()
    .from(profiles);

    res.json(profileList);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function getProfileById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id));

    if (!profile){
        res.status(404).send({message: "Profile not found"});
    } else {
        res.json(profile);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function createProfile(req: Request, res: Response) {
  try {
    // Basic validation/typing might be needed for req.body
    const [profile] = await db
      .insert(profiles)
      .values(req.body) // Assuming req.body matches the profile schema structure
      .returning();
    res.status(201).json(profile);
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updatedFields = req.body; // Assuming req.body contains fields to update

    const [profile] = await db
    .update(profiles)
    .set(updatedFields)
    .where(eq(profiles.id, id))
    .returning();

    if (profile) {
        res.json(profile);
    } else {
        res.status(404).send({message: "Profile was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function deleteProfile(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedProfile] = await db
    .delete(profiles)
    .where(eq(profiles.id, id))
    .returning();

    if (deletedProfile) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Profile was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
