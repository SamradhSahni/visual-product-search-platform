// server/src/routes/activity.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const {
  recordView,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/user.activity.controller");

router.post("/view", protect, recordView); // body: { productId }
router.post("/wishlist/add", protect, addToWishlist); // body: { productId }
router.post("/wishlist/remove", protect, removeFromWishlist); // body: { productId }

module.exports = router;
