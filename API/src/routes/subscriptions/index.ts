import { Router } from "express";
import { listSubscriptions, getSubscriptionById, createSubscription, updateSubscription, deleteSubscription } from "./subscriptionsController";

const router = Router();

router.get("/", listSubscriptions);
router.get("/:id", getSubscriptionById);
router.post("/", createSubscription);
router.put("/:id", updateSubscription);
router.delete("/:id", deleteSubscription);

export default router;
