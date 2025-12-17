// server/src/models/Product.model.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    // Single main image
    imageUrl: {
      type: String, // e.g. "/uploads/product_images/filename.jpg"
      default: null,
    },

    // We can keep this if you ever want multiple images later
    images: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Analytics / popularity fields
    viewsCount: {
      type: Number,
      default: 0,
    },
    addToCartCount: {
      type: Number,
      default: 0,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    popularityScore: {
      type: Number,
      default: 0,
    },

    // ML-related fields
    imageEmbedding: {
      type: [Number],
      default: undefined,
    },
    textEmbedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
