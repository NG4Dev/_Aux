import { Router } from "express";
import { listGuestLists, getGuestListById, createGuestList, updateGuestList, deleteGuestList } from "./guestListsController";

const router = Router();

router.get("/", listGuestLists);
router.get("/:id", getGuestListById);
router.post("/", createGuestList);
router.put("/:id", updateGuestList);
router.delete("/:id", deleteGuestList);

export default router;
