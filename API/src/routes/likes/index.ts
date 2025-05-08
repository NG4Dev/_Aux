import { Router } from "express";
import { listLikes, getLikeById, createLike, updateLike, deleteLike } from "./likesController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listLikes as RequestHandler);
router.get("/:id", getLikeById as RequestHandler);
router.post("/", createLike as RequestHandler);
router.put("/:id", updateLike as RequestHandler);
router.delete("/:id", deleteLike as RequestHandler);

export default router;
