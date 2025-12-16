// server/src/controllers/user.activity.controller.js
const User = require("../models/User.model");
const Product = require("../models/Product.model");
const mongoose = require("mongoose");

// Add a product to user's view history (keeping latest N entries)
exports.recordView = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const MAX_HISTORY = 50;

    const user = await User.findById(userId);

    // Remove existing entry for this product (if present)
    user.viewedProducts = (user.viewedProducts || []).filter(
      (entry) => entry.product.toString() !== productId.toString()
    );

    // Add new entry at beginning
    user.viewedProducts.unshift({ product: productId, viewedAt: new Date() });

    // Trim to MAX_HISTORY
    if (user.viewedProducts.length > MAX_HISTORY) {
      user.viewedProducts = user.viewedProducts.slice(0, MAX_HISTORY);
    }

    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("recordView error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add / remove product in wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const user = await User.findById(userId);

    const exists = (user.wishlist || []).some(
      (entry) => entry.product.toString() === productId.toString()
    );

    if (exists) {
      return res.status(400).json({ success: false, message: "Already in wishlist" });
    }

    user.wishlist.unshift({ product: productId, addedAt: new Date() });

    // Keep wishlist to reasonable length, optional
    if (user.wishlist.length > 200) user.wishlist = user.wishlist.slice(0, 200);

    await user.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("addToWishlist error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const user = await User.findById(userId);
    user.wishlist = (user.wishlist || []).filter(
      (entry) => entry.product.toString() !== productId.toString()
    );
    await user.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
