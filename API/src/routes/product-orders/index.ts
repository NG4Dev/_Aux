import { Router } from "express";
import { listProductOrders, getProductOrderById, createProductOrder, updateProductOrder, deleteProductOrder } from "./productOrdersController";

const router = Router();

router.get("/", listProductOrders);
router.get("/:id", getProductOrderById);
router.post("/", createProductOrder);
router.put("/:id", updateProductOrder);
router.delete("/:id", deleteProductOrder);

export default router;
