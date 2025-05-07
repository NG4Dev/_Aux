import { Router } from "express";
import { listEvents, getEventById, createEvent, updateEvent, deleteEvent } from "./eventsController";

const router = Router();

router.get("/", listEvents);
router.get("/:id", getEventById);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;
