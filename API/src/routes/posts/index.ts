import { Router } from "express";
import { listPosts, getPostById, createPost, updatePost, deletePost } from "./postsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listPosts as RequestHandler);
router.get("/:id", getPostById as RequestHandler);
router.post("/", createPost as RequestHandler);
router.put("/:id", updatePost as RequestHandler);
router.delete("/:id", deletePost as RequestHandler);

export default router;
