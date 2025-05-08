import { Router } from "express";
import { listBusinesses, getBusinessById, createBusiness, updateBusiness, deleteBusiness } from "./businessesController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listBusinesses as RequestHandler);
router.get("/:id", getBusinessById as RequestHandler);
router.post("/", createBusiness as RequestHandler);
router.put("/:id", updateBusiness as RequestHandler);
router.delete("/:id", deleteBusiness as RequestHandler);

export default router;
