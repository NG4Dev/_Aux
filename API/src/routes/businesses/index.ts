import { Router } from "express";
import { listBusinesses, getBusinessById, createBusiness, updateBusiness, deleteBusiness } from "./businessesController";

const router = Router();

router.get("/", listBusinesses);
router.get("/:id", getBusinessById);
router.post("/", createBusiness);
router.put("/:id", updateBusiness);
router.delete("/:id", deleteBusiness);

export default router;
