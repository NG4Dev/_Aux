import { Router } from "express";
import { listComments, getCommentById, createComment, updateComment, deleteComment } from "./commentsController";

const router = Router();

router.get("/", listComments);
router.get("/:id", getCommentById);
router.post("/", createComment);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;
