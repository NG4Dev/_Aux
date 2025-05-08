import { Router } from "express";
import { listImages, getImageById, createImage, updateImage, deleteImage } from "./imagesController";
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listImages as RequestHandler);
router.get("/:id", getImageById as RequestHandler);
router.post("/", createImage as RequestHandler);
router.put("/:id", updateImage as RequestHandler);
router.delete("/:id", deleteImage as RequestHandler);

export default router;
