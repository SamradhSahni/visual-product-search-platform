// server/src/models/Order.model.js
const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: String,
  price: Number,
  qty: Number,
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  imageUrl: String,
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: [OrderItemSchema], default: [] },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid", "failed", "cancelled", "shipped"], default: "pending" },
  paymentMeta: { type: Object }, // store payment gateway response or simulated data
  shippingAddress: {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
