import { Router } from "express";
import { listProductCategories, getProductCategoryById, createProductCategory, updateProductCategory, deleteProductCategory } from "./productCategoriesController"; // Assuming these functions exist
import { RequestHandler } from 'express'; // Import RequestHandler

const router = Router();

router.get("/", listProductCategories as RequestHandler);
router.get("/:id", getProductCategoryById as RequestHandler);
router.post("/", createProductCategory as RequestHandler);
router.put("/:id", updateProductCategory as RequestHandler);
router.delete("/:id", deleteProductCategory as RequestHandler);

export default router;
