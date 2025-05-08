import { Router } from "express";
import { listFollowers, getFollowerById, createFollower, deleteFollower } from "./followersController";
import { Request, Response, RequestHandler } from 'express'; // Import Request, Response, RequestHandler

const router = Router();

router.get("/", listFollowers as RequestHandler);
router.get("/:id", getFollowerById as RequestHandler); // Might need adjustment based on how followers are identified
router.post("/", createFollower as RequestHandler);
router.delete("/:id", deleteFollower as RequestHandler); // Might need adjustment based on how followers are identified

export default router;
