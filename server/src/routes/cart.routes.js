// server/src/routes/cart.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const cartController = require("../controllers/cart.controller");

router.get("/", protect, cartController.getCart);
router.post("/add", protect, cartController.addToCart);
router.put("/update", protect, cartController.updateCartItem);
router.post("/remove", protect, cartController.removeCartItem);
router.post("/clear", protect, cartController.clearCart);

module.exports = router;
