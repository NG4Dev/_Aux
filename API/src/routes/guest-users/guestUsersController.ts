import { Request, Response } from "express";
import { db } from "../../db/index";
import { guestUsers } from "../../db/entities/guestUserSchema"; // Import guestUsers schema
import { eq } from "drizzle-orm"; // Import eq

//Test by going to this url: http://localhost:3000/guest-users

export async function listGuestUsers(req: Request, res: Response) {
  try {
    const guestUserList = await db
    .select()
    .from(guestUsers);

    res.json(guestUserList);
  } catch (e) {
    res.status(500).send(e);
  }
}

//Test by going to this url: http://localhost:3000/guest-users/71972ea5-e7d0-4b13-a11e-41b6ffdaaf0b

export async function getGuestUserById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [guestUser] = await db
      .select()
      .from(guestUsers)
      .where(eq(guestUsers.id, id));

    if (!guestUser){
        res.status(404).send({message: "Guest user not found"});
    } else {
        res.json(guestUser);
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

//Test with:  Invoke-WebRequest -Method POST -Uri "http://localhost:3000/guest-users" -ContentType "application/json" -Body '{"emailAddress":"123456@123456.com","isOnboarded":false}'

export async function createGuestUser(req: Request, res: Response) {
  try {
    // Expecting req.body to contain emailAddress and potentially isOnboarded
    const { emailAddress, isOnboarded } = req.body;

    if (!emailAddress) {
        return res.status(400).send({ message: "Email address is required" });
    }

    const [guestUser] = await db
      .insert(guestUsers)
      .values({ emailAddress, isOnboarded })
      .returning();
    res.status(201).json(guestUser);
  } catch (e) {
    res.status(500).send(e);
  }
}

//Test with: Invoke-RestMethod -Uri "http://localhost:3000/guest-users/29436d47-5681-4122-836f-53f2c67a6c26" -Method Put -Headers @{ "Content-Type" = "application/json" } -Body '{"isOnboarded": true}'

export async function updateGuestUser(req: Request, res: Response) {
  try {
    // Expecting req.body to contain id, and potentially email_Address and is_Onboarded
    const { id, email_Address, is_Onboarded } = req.body;

    if (!id) {
        return res.status(400).send({ message: "ID is required in the request body" });
    }

    const fieldsToUpdate: any = {};
    // Do NOT include email_Address or id in fieldsToUpdate to prevent updating them
    // if (email_Address !== undefined) {
    //     fieldsToUpdate.emailAddress = email_Address;
    // }
    if (is_Onboarded !== undefined) {
        // Convert string "false" or "true" to boolean, or handle direct boolean input
        fieldsToUpdate.isOnboarded = is_Onboarded === "true" || is_Onboarded === true;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
         return res.status(400).send({ message: "No valid fields provided for update (email and ID cannot be updated)" });
    }

    const [guestUser] = await db
    .update(guestUsers)
    .set(fieldsToUpdate)
    .where(eq(guestUsers.id, id))
    .returning();

    if (guestUser) {
        res.json(guestUser);
    } else {
        res.status(404).send({message: "Guest user was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}

//Test with: Invoke-RestMethod -Uri "http://localhost:3000/guest-users/7e915af6-4e7b-4b64-ae8f-23666e6f37c2" -Method Delete
export async function deleteGuestUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const [deletedGuestUser] = await db
    .delete(guestUsers)
    .where(eq(guestUsers.id, id))
    .returning();

    if (deletedGuestUser) {
        res.status(204).send();
    } else {
        res.status(404).send({message: "Guest user was not found"})
    }
  } catch (e) {
    res.status(500).send(e);
  }
}
