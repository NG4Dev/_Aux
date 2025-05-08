import { Router } from "express";
import { listPostMedia, getPostMediaById, createPostMedia, updatePostMedia, deletePostMedia } from "./postMediaController"; // Assuming these functions exist
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listPostMedia as RequestHandler);
router.get("/:id", getPostMediaById as RequestHandler);
router.post("/", createPostMedia as RequestHandler);
router.put("/:id", updatePostMedia as RequestHandler);
router.delete("/:id", deletePostMedia as RequestHandler);

export default router;
