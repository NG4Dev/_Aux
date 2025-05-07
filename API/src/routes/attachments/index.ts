import { Router } from "express";
import { listAttachments, getAttachmentById, createAttachment, updateAttachment, deleteAttachment } from "./attachmentsController";

const router = Router();

router.get("/", listAttachments);
router.get("/:id", getAttachmentById);
router.post("/", createAttachment);
router.put("/:id", updateAttachment);
router.delete("/:id", deleteAttachment);

export default router;
