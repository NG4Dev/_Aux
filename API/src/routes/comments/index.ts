import { Router } from "express";
import { listComments, getCommentById, createComment, updateComment, deleteComment } from "./commentsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listComments as RequestHandler);
router.get("/:id", getCommentById as RequestHandler);
router.post("/", createComment as RequestHandler);
router.put("/:id", updateComment as RequestHandler);
router.delete("/:id", deleteComment as RequestHandler);

export default router;
