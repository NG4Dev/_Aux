import { Router } from "express";
import { listResaleRatings, getResaleRatingById, createResaleRating, updateResaleRating, deleteResaleRating } from "./resaleRatingsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listResaleRatings as RequestHandler);
router.get("/:id", getResaleRatingById as RequestHandler);
router.post("/", createResaleRating as RequestHandler);
router.put("/:id", updateResaleRating as RequestHandler);
router.delete("/:id", deleteResaleRating as RequestHandler);

export default router;
