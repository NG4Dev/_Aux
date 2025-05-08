import { Router } from "express";
import { listConversations, getConversationById, createConversation, updateConversation, deleteConversation } from "./conversationsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listConversations as RequestHandler);
router.get("/:id", getConversationById as RequestHandler);
router.post("/", createConversation as RequestHandler);
router.put("/:id", updateConversation as RequestHandler);
router.delete("/:id", deleteConversation as RequestHandler);

export default router;
