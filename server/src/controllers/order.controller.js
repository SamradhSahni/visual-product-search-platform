// server/src/controllers/order.controller.js
const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");
const mongoose = require("mongoose");

/**
 * Helper compute totals: subtotal, tax, shipping, total
 * You can tweak tax/shipping rules
 */
function computeTotals(items) {
  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  const taxRate = 0.12; // 12% GST-like
  const tax = Number((subtotal * taxRate).toFixed(2));
  const shipping = subtotal > 2000 ? 0 : 99; // free shipping over ₹2000
  const total = Number((subtotal + tax + shipping).toFixed(2));
  return { subtotal, tax, shipping, total };
}

// POST /api/orders/create
// Body: { shippingAddress: {...} } - uses current cart
exports.createOrderFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Build order items and check stock
    const items = [];
    for (const ci of cart.items) {
      const p = await Product.findById(ci.product._id).session(session);
      if (!p || !p.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Product not available: ${ci.title}` });
      }
      if (p.stock != null && p.stock < ci.qty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${ci.title}` });
      }
      items.push({
        product: p._id,
        title: p.title,
        price: Number(p.price) || 0,
        qty: Number(ci.qty),
        vendor: p.vendor,
        imageUrl: p.imageUrl || null,
      });
    }

    // Compute totals
    const { subtotal, tax, shipping, total } = computeTotals(items);

    const order = new Order({
      user: userId,
      items,
      subtotal,
      tax,
      shipping,
      total,
      status: "pending",
      shippingAddress: req.body.shippingAddress || {},
    });

    await order.save({ session });

    // Optionally, decrement stock now or after payment (we'll decrement on successful payment)
    // Keep cart intact until payment success. But to avoid oversell, you may reserve stock.
    // For this simple implementation we do not decrement stock here.

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("createOrderFromCart error:", err);
    res.status(500).json({ success: false, message: "Server error while creating order" });
  }
};

// POST /api/orders/:id/pay  (simulate payment)
// Body: { method: "mock-card", simulate: "success"|"fail" }
exports.simulatePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const orderId = req.params.id;
    const { simulate = "success" } = req.body;

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status === "paid") {
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ success: true, message: "Already paid", order });
    }

    if (simulate === "fail") {
      order.status = "failed";
      order.paymentMeta = { provider: "mock", result: "failed" };
      await order.save({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Payment failed", order });
    }

    // simulate success: update order status, paidAt, decrement stock, clear user's cart
    order.status = "paid";
    order.paidAt = new Date();
    order.paymentMeta = {
      provider: "mock",
      transactionId: `MOCK-${Date.now()}`,
      method: req.body.method || "mock-card",
    };

    await order.save({ session });

    // decrement stock and update popularity counters
    for (const it of order.items) {
      const p = await Product.findById(it.product).session(session);
      if (p) {
        p.stock = Math.max(0, (p.stock || 0) - it.qty);
        p.purchaseCount = (p.purchaseCount || 0) + it.qty;
        p.popularityScore = (p.popularityScore || 0) + (5 * it.qty);
        await p.save({ session });
      }
    }

    // clear user's cart
    await Cart.findOneAndUpdate({ user: order.user }, { items: [] }, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("simulatePayment error:", err);
    res.status(500).json({ success: false, message: "Server error during payment" });
  }
};

// GET /api/orders/my   -> user orders
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/orders/:id  -> order details (user or admin)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Only owner or admin access (you can extend to vendor view)
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin: GET /api/orders (list all)
exports.getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Not authorized" });
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
