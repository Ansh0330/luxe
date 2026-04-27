import { Router } from "express";
import { isSeller } from "../middlewares/auth.middleware.js";
import {
  addProductVariant,
  createProduct,
  getAllProducts,
  getProductById,
  getSellerProducts,
} from "../controllers/products.controller.js";
import multer from "multer";
import { createProductValidator } from "../validators/products.validator.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

const productsRouter = Router();

/**
 * @route POST /api/products
 * @description Create a new product
 * @access Private (Seller only)
 */
productsRouter.post(
  "/",
  isSeller,
  upload.array("images", 7),
  createProductValidator,
  createProduct,
);

/**
 * @route GET /api/products/seller
 * @description Get products of the logged-in seller
 * @access Private (Seller only)
 */
productsRouter.get("/seller", isSeller, getSellerProducts);

/*
 * @route GET /api/products/allProducts
 * @description Get all products (for buyers)
 * @access Public
 */
productsRouter.get("/allProducts", getAllProducts);

/*
 * @route GET /api/products/productId
 * @description Get product by Id (for buyers)
 * @access Public
*/

productsRouter.get("/detail/:productId", getProductById);

/*
 * @route POST /api/products/:productId/variants
 * @description Add a new variant to a product (for sellers)
 * @access Private (Seller only)
*/

productsRouter.post("/:productId/variants", isSeller, upload.array("images", 7), addProductVariant);

export default productsRouter;
