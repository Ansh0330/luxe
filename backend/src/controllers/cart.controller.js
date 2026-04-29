import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import { stockOfVariant } from "../dao/product.dao.js";

export const addToCart = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const quantity = parseInt(req.body.quantity) || 1;

    const product = await productModel.findOne(
      { _id: productId, "variants._id": variantId },
      { "variants.$": 1 },
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product or variant not found" });
    }

    const stock = await stockOfVariant(productId, variantId);

    const cart =
      (await cartModel.findOne({ user: req.user.id })) ||
      (await cartModel.create({ user: req.user.id }));

    const isProductAlreadyInCart = cart.items.some(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId,
    );

    if (isProductAlreadyInCart) {
      const quantityInCart = cart.items.find(
        (item) =>
          item.product.toString() === productId &&
          item.variant.toString() === variantId,
      ).quantity;

      if (quantityInCart + 1 > stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than available stock. Current quantity in cart: ${quantityInCart}, Available stock: ${stock}`,
        });
      }

      await cartModel.findOneAndUpdate(
        {
          user: req.user.id,
          "items.product": productId,
          "items.variant": variantId,
        },
        { $inc: { "items.$.quantity": quantity } },
        { new: true },
      );

      return res
        .status(200)
        .json({ success: true, message: "Cart updated successfully" });
    }

    if (quantity > stock) {
      return res.status(400).json({
        success: false,
        message: `Cannot add more than available stock. Available stock: ${stock}`,
      });
    }

    cart.items.push({ product: productId, variant: variantId, quantity });
    await cart.save();

    res.status(200).json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.log("Error in adding item to cart", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCart = async (req, res) => {
  try {
    const user = req.user.id;

    const cart = await cartModel.findOne({ user }).populate("items.product");

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Cart retrieved successfully", cart });
  } catch (error) {
    console.log("Error in getting the cart details", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
