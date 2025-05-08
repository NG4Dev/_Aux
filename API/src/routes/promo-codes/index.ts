import { Router } from "express";
import { listPromoCodes, getPromoCodeById, createPromoCode, updatePromoCode, deletePromoCode } from "./promoCodesController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listPromoCodes as RequestHandler);
router.get("/:id", getPromoCodeById as RequestHandler);
router.post("/", createPromoCode as RequestHandler);
router.put("/:id", updatePromoCode as RequestHandler);
router.delete("/:id", deletePromoCode as RequestHandler);

export default router;
