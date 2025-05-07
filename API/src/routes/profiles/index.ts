import { Router } from "express";
import { listProfiles, getProfileById, createProfile, updateProfile, deleteProfile } from "./profilesController";

const router = Router();

router.get("/", listProfiles);
router.get("/:id", getProfileById);
router.post("/", createProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

export default router;
