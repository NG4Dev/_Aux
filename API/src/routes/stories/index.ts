import { Router } from "express";
import { listStories, getStoryById, createStory, updateStory, deleteStory } from "./storiesController";

const router = Router();

router.get("/", listStories);
router.get("/:id", getStoryById);
router.post("/", createStory);
router.put("/:id", updateStory);
router.delete("/:id", deleteStory);

export default router;
