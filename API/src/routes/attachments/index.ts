import { Router } from "express";
import { listAttachments, getAttachmentById, createAttachment, updateAttachment, deleteAttachment } from "./attachmentsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listAttachments as RequestHandler);
router.get("/:id", getAttachmentById as RequestHandler);
router.post("/", createAttachment as RequestHandler);
router.put("/:id", updateAttachment as RequestHandler);
router.delete("/:id", deleteAttachment as RequestHandler);

export default router;
