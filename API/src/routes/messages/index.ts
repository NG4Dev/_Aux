import { Router } from "express";
import { listMessages, getMessageById, createMessage, updateMessage, deleteMessage } from "./messagesController";

const router = Router();

router.get("/", listMessages);
router.get("/:id", getMessageById);
router.post("/", createMessage);
router.put("/:id", updateMessage);
router.delete("/:id", deleteMessage);

export default router;
