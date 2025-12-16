// server/src/controllers/cart.controller.js
const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");

/**
 * Helper to create/update cart item shape based on product
 */
function cartItemFromProduct(product, qty = 1) {
  return {
    product: product._id,
    title: product.title,
    price: Number(product.price) || 0,
    qty: Number(qty) || 1,
    vendor: product.vendor,
    imageUrl: product.imageUrl || null,
  };
}

// GET /api/cart/         -> get or create empty cart for user
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    let cart = await Cart.findOne({ user: userId }).populate("items.product", "title price imageUrl stock");
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/cart/add    -> { productId, qty }
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const existing = cart.items.find((it) => it.product.toString() === productId.toString());
    if (existing) {
      existing.qty = Math.min((existing.qty || 0) + Number(qty || 1), 1000);
    } else {
      cart.items.push(cartItemFromProduct(product, qty));
    }
    cart.updatedAt = new Date();
    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/cart/update -> { productId, qty }
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    let qty = req.body.qty;

    // coerce qty
    qty = Number(qty);
    if (Number.isNaN(qty)) qty = 1;
    qty = Math.floor(qty);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const idx = cart.items.findIndex((i) => i.product.toString() === productId.toString());
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    if (qty <= 0) {
      // remove the item
      cart.items.splice(idx, 1);
    } else {
      // optional: ensure requested qty <= available stock
      const p = await Product.findById(productId);
      if (p && typeof p.stock === "number" && p.stock < qty) {
        // cap to stock if you prefer — here we return an error
        return res.status(400).json({
          success: false,
          message: `Only ${p.stock} units available for ${p.title}`,
          availableStock: p.stock,
        });
      }
      cart.items[idx].qty = qty;
    }

    cart.updatedAt = new Date();
    await cart.save();

    // populate product references for client convenience
    const populated = await Cart.findOne({ user: userId }).populate("items.product", "title price imageUrl stock");

    return res.status(200).json({ success: true, cart: populated });
  } catch (err) {
    console.error("updateCartItem error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/cart/remove -> { productId }
exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.product.toString() !== productId.toString());
    cart.updatedAt = new Date();
    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error("removeCartItem error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/cart/clear -> clears user's cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.findOneAndUpdate({ user: userId }, { items: [], updatedAt: new Date() }, { upsert: true });
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("clearCart error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
