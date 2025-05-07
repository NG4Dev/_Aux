import { Router } from "express";
import { listConversations, getConversationById, createConversation, updateConversation, deleteConversation } from "./conversationsController";

const router = Router();

router.get("/", listConversations);
router.get("/:id", getConversationById);
router.post("/", createConversation);
router.put("/:id", updateConversation);
router.delete("/:id", deleteConversation);

export default router;
