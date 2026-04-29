import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { validateAddToCart } from '../validators/cart.validator.js';
import { addToCart, getCart } from '../controllers/cart.controller.js';

const cartRouter = express.Router();


cartRouter.post("/:productId/:variantId", isAuthenticated, validateAddToCart,addToCart);
cartRouter.get("/", isAuthenticated, getCart)


export default cartRouter;