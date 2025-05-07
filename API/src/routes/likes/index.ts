import { Router } from "express";
import { listLikes, getLikeById, createLike, updateLike, deleteLike } from "./likesController";

const router = Router();

router.get("/", listLikes);
router.get("/:id", getLikeById);
router.post("/", createLike);
router.put("/:id", updateLike);
router.delete("/:id", deleteLike);

export default router;
