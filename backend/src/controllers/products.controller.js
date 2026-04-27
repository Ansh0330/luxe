import { Mongoose, Schema } from "mongoose";
import productModel from "../models/product.model.js";
import { uploadImage } from "../services/storage.service.js";

export const createProduct = async (req, res) => {
  try {
    const { title, description, priceAmount, priceCurrency } = req.body;
    const seller = req.user; // Assuming the authenticated user is available in req.user

    const images = await Promise.all(
      req.files.map(async (file) => {
        return await uploadImage({
          buffer: file.buffer,
          filename: file.originalname,
        });
      }),
    );

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    const product = await productModel.create({
      title,
      description,
      price: {
        amount: parseFloat(priceAmount), // Ensure price is stored as a number
        currency: priceCurrency || "INR", // You can make this dynamic based on your requirements
      },
      images,
      sellerId: seller.id, // Store the seller's ID in the product document
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Error creating product" });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const seller = req.user; // Assuming the authenticated user is available in req.user

    const products = await productModel
      .find({ sellerId: seller.id })
      .populate("sellerId", "fullname email"); // Populate seller details (name and email)

    res.status(200).json({
      success: true,
      message: "Seller products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching seller products" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find();

    res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching all products" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await productModel
      .findById(productId)
      .populate("sellerId", "fullname email"); // Populate seller details (name and email)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching product by ID" });
  }
};

export const addProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productModel.findOne({
      _id: productId,
      sellerId: req.user.id, // Ensure the product belongs to the authenticated seller
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const files = req.files; // Assuming the images are sent as multipart/form-data
    const images = [];

    if (files && files.length > 0) {
      await Promise.all(
        files.map(async (file) => {
          const imageUrl = await uploadImage({
            buffer: file.buffer,
            filename: file.originalname,
          });
          images.push(imageUrl);
        }),
      );
    }

    const price = req.body.priceAmount ? parseFloat(req.body.priceAmount) : ""; // Ensure price is stored as a number

    const stock = req.body.stock ? parseInt(req.body.stock) : ""; // Ensure stock is stored as a number
    const attributes = req.body.attributes
      ? JSON.parse(req.body.attributes)
      : ""; // Parse attributes if provided

    product.variants.push({
      images,
      price: {
        amount: price || product.price.amount, // Use the variant price if provided, otherwise fallback to the main product price
        currency: req.body.priceCurrency || product.price.currency, // You can make this dynamic based on your requirements
      },
      stock,
      attributes,
    });

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product variant added successfully",
      product,
    });
  } catch (error) {
    console.log("Error in add product variant", error);
    res
      .status(500)
      .json({ success: false, message: "Error adding product variant" });
  }
};
