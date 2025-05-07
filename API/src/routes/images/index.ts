import { Router } from "express";
import { listImages, getImageById, createImage, updateImage, deleteImage } from "./imagesController";

const router = Router();

router.get("/", listImages);
router.get("/:id", getImageById);
router.post("/", createImage);
router.put("/:id", updateImage);
router.delete("/:id", deleteImage);

export default router;
