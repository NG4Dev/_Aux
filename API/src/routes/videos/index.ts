import { Router } from "express";
import { listVideos, getVideoById, createVideo, updateVideo, deleteVideo } from "./videosController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listVideos as RequestHandler);
router.get("/:id", getVideoById as RequestHandler);
router.post("/", createVideo as RequestHandler);
router.put("/:id", updateVideo as RequestHandler);
router.delete("/:id", deleteVideo as RequestHandler);

export default router;
