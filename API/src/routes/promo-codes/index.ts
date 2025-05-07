import { Router } from "express";
import { listPromoCodes, getPromoCodeById, createPromoCode, updatePromoCode, deletePromoCode } from "./promoCodesController";

const router = Router();

router.get("/", listPromoCodes);
router.get("/:id", getPromoCodeById);
router.post("/", createPromoCode);
router.put("/:id", updatePromoCode);
router.delete("/:id", deletePromoCode);

export default router;
