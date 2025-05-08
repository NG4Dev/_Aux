import { Router } from "express";
import { listMessages, getMessageById, createMessage, updateMessage, deleteMessage } from "./messagesController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listMessages as RequestHandler);
router.get("/:id", getMessageById as RequestHandler);
router.post("/", createMessage as RequestHandler);
router.put("/:id", updateMessage as RequestHandler);
router.delete("/:id", deleteMessage as RequestHandler);

export default router;
