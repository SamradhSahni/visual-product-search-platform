// server/src/models/Cart.model.js
const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: String,
  price: Number,
  qty: { type: Number, default: 1, min: 1 },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
  imageUrl: String,
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  items: { type: [CartItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Cart", CartSchema);
