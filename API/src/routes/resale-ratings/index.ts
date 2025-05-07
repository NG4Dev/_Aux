import { Router } from "express";
import { listResaleRatings, getResaleRatingById, createResaleRating, updateResaleRating, deleteResaleRating } from "./resaleRatingsController";

const router = Router();

router.get("/", listResaleRatings);
router.get("/:id", getResaleRatingById);
router.post("/", createResaleRating);
router.put("/:id", updateResaleRating);
router.delete("/:id", deleteResaleRating);

export default router;
