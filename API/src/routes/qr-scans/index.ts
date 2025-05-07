import { Router } from "express";
import { listQrScans, getQrScanById, createQrScan, updateQrScan, deleteQrScan } from "./qrScansController";

const router = Router();

router.get("/", listQrScans);
router.get("/:id", getQrScanById);
router.post("/", createQrScan);
router.put("/:id", updateQrScan);
router.delete("/:id", deleteQrScan);

export default router;
