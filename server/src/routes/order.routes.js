// server/src/routes/order.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const orderController = require("../controllers/order.controller");

router.post("/create", protect, orderController.createOrderFromCart);
router.post("/:id/pay", protect, orderController.simulatePayment);
router.get("/my", protect, orderController.getMyOrders);
router.get("/:id", protect, orderController.getOrderById);
router.get("/", protect, orderController.getAllOrders); // admin
module.exports = router;
