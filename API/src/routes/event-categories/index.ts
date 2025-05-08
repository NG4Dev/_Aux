import { Router } from "express";
import { listEventCategories, getEventCategoryById, createEventCategory, updateEventCategory, deleteEventCategory } from "./eventCategoriesController"; // Assuming these functions exist
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listEventCategories as RequestHandler);
router.get("/:id", getEventCategoryById as RequestHandler);
router.post("/", createEventCategory as RequestHandler);
router.put("/:id", updateEventCategory as RequestHandler);
router.delete("/:id", deleteEventCategory as RequestHandler);

export default router;
