import { Router } from "express";
import { listGuestUsers, getGuestUserById, createGuestUser, updateGuestUser, deleteGuestUser } from "./guestUsersController"; // Assuming these functions exist
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listGuestUsers as RequestHandler);
router.get("/:id", getGuestUserById as RequestHandler);
router.post("/", createGuestUser as RequestHandler);
router.put("/:id", updateGuestUser as RequestHandler);
router.delete("/:id", deleteGuestUser as RequestHandler);

export default router;
