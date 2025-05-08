import { Router } from "express";
import { listUsers, getUserById, createUser, updateUser, deleteUser } from "./usersController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listUsers as RequestHandler);
router.get("/:id", getUserById as RequestHandler);
router.post("/", createUser as RequestHandler);
router.put("/:id", updateUser as RequestHandler);
router.delete("/:id", deleteUser as RequestHandler);

export default router;
