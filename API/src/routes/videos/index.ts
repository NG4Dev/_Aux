import { Router } from "express";
import { listVideos, getVideoById, createVideo, updateVideo, deleteVideo } from "./videosController";

const router = Router();

router.get("/", listVideos);
router.get("/:id", getVideoById);
router.post("/", createVideo);
router.put("/:id", updateVideo);
router.delete("/:id", deleteVideo);

export default router;
