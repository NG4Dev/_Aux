import { Router } from "express";
import { listEvents, getEventById, createEvent, updateEvent, deleteEvent } from "./eventsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listEvents as RequestHandler);
router.get("/:id", getEventById as RequestHandler);
router.post("/", createEvent as RequestHandler);
router.put("/:id", updateEvent as RequestHandler);
router.delete("/:id", deleteEvent as RequestHandler);

export default router;
