import { Router } from "express";
import { listGuestLists, getGuestListById, createGuestList, updateGuestList, deleteGuestList } from "./guestListsController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listGuestLists as RequestHandler);
router.get("/:id", getGuestListById as RequestHandler);
router.post("/", createGuestList as RequestHandler);
router.put("/:id", updateGuestList as RequestHandler);
router.delete("/:id", deleteGuestList as RequestHandler);

export default router;
