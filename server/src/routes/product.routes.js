// server/src/routes/product.routes.js
const express = require("express");
const router = express.Router();

/* =========================
   Controllers
========================= */
const {
  createProduct,
  getAllProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getSimilarProducts,
  getTrendingProducts,
  registerProductView,
} = require("../controllers/product.controller");

/* =========================
   Middlewares
========================= */
const { isAuth, isVendor } = require("../middleware/auth.middleware");
const { uploadProductImage } = require("../middleware/upload.middleware");

/* =========================
   PUBLIC ROUTES
========================= */

// Get all products (browse / search)
router.get("/", getAllProducts);

// Trending products (must be before :id)
router.get("/trending/top", getTrendingProducts);

// Similar products (must be before :id)
router.get("/:id/similar", getSimilarProducts);

// Register product view (analytics)
router.post("/:id/view", registerProductView);

// Get single product
router.get("/:id", getProductById);

/* =========================
   VENDOR / ADMIN ROUTES
========================= */

// Create product
router.post(
  "/",
  isAuth,
  isVendor,
  uploadProductImage,
  createProduct
);

// Get products created by logged-in vendor
router.get(
  "/my/products",
  isAuth,
  isVendor,
  getMyProducts
);

// Update product
router.put(
  "/:id",
  isAuth,
  isVendor,
  uploadProductImage,
  updateProduct
);

// Delete product
router.delete(
  "/:id",
  isAuth,
  isVendor,
  deleteProduct
);

module.exports = router;
