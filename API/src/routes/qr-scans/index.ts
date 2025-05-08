import { Router } from "express";
import { listQrScans, getQrScanById, createQrScan, updateQrScan, deleteQrScan } from "./qrScansController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listQrScans as RequestHandler);
router.get("/:id", getQrScanById as RequestHandler);
router.post("/", createQrScan as RequestHandler);
router.put("/:id", updateQrScan as RequestHandler);
router.delete("/:id", deleteQrScan as RequestHandler);

export default router;
