import { Router } from "express";
import { listSubscriptions, getSubscriptionById, createSubscription, updateSubscription, deleteSubscription } from "./subscriptionsController";
import { Request, Response, RequestHandler } from 'express'; // Import Request, Response, RequestHandler

const router = Router();

router.get("/", listSubscriptions as RequestHandler);
router.get("/:id", getSubscriptionById as RequestHandler);
router.post("/", createSubscription as RequestHandler);
router.put("/:id", updateSubscription as RequestHandler);
router.delete("/:id", deleteSubscription as RequestHandler);

export default router;
