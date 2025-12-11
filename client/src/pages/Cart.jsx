// client/src/pages/Cart.jsx
import React, { useEffect, useState, useRef } from "react";
import { getCart, updateCartItem, removeCartItem } from "../api/cart";
import { useNavigate, Link } from "react-router-dom";

/**
 * Cart page with optimistic + debounced qty updates
 *
 * Expects client/src/api/cart.js to export:
 * - getCart()
 * - updateCartItem(productId, qty)
 * - removeCartItem(productId)
 */

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Map to hold debounce timers per product
  const qtyTimersRef = useRef(new Map());

  useEffect(() => {
    loadCart();
    // cleanup on unmount
    return () => {
      // clear any timers
      qtyTimersRef.current.forEach((t) => clearTimeout(t));
      qtyTimersRef.current.clear();
    };
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCart();
      if (res && res.success) {
        setCart(res.cart);
      } else {
        setCart({ items: [] });
        setError(res?.message || "Failed to fetch cart");
      }
    } catch (err) {
      console.error("loadCart error", err);
      setError(err?.response?.data?.message || "Failed to load cart");
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  // Debounced optimistic update for quantity
  const handleQtyChange = (productId, value) => {
    // Accept string/numeric input; coerce to integer >= 1
    let qty = Number(value);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    qty = Math.floor(qty);

    // Optimistic UI update locally
    setCart((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it) =>
        it.product.toString() === productId.toString() ? { ...it, qty } : it
      );
      return { ...prev, items };
    });

    // Clear any existing timer for this product
    const timers = qtyTimersRef.current;
    if (timers.has(productId)) {
      clearTimeout(timers.get(productId));
    }

    // Debounce: wait 600ms before calling API
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await updateCartItem(productId, qty); // IMPORTANT: imported function name
        if (res && res.success && res.cart) {
          setCart(res.cart);
        } else if (res && res.cart) {
          setCart(res.cart);
        } else {
          // fallback: reload cart to re-sync UI
          await loadCart();
        }
      } catch (err) {
        console.error("update qty error", err);
        // revert by reloading cart from server
        try {
          await loadCart();
        } catch (e) {
          console.error("Failed to reload cart after qty update error", e);
        }
      } finally {
        setSaving(false);
        timers.delete(productId);
      }
    }, 600);

    timers.set(productId, timer);
  };

  const handleRemove = async (productId) => {
    if (!confirm("Remove this item from cart?")) return;
    setSaving(true);
    try {
      const res = await removeCartItem(productId);
      if (res && res.success) {
        // res.cart expected
        if (res.cart) setCart(res.cart);
        else await loadCart();
      } else {
        alert(res?.message || "Failed to remove item");
      }
    } catch (err) {
      console.error("remove item error", err);
      alert("Failed to remove item");
      await loadCart();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 28 }}>Loading cart...</div>;

  const items = cart?.items || [];
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
  const tax = Number((subtotal * 0.12).toFixed(2));
  const shipping = subtotal > 2000 ? 0 : items.length > 0 ? 99 : 0;
  const total = Number((subtotal + tax + shipping).toFixed(2));

  return (
    <div style={{ paddingTop: 24 }}>
      <h1>Cart</h1>

      {items.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <Link to="/browse">Continue shopping</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 320px", gap: 20 }}>
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Subtotal</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.product} style={{ borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {it.imageUrl ? (
                          <img src={`http://localhost:5000${it.imageUrl}`} alt={it.title} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: 8, background: "#0f172a" }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{it.title}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: 12 }}>₹ {Number(it.price).toLocaleString()}</td>

                    <td style={{ padding: 12 }}>
                      <input
                        type="number"
                        value={it.qty}
                        min={1}
                        max={1000}
                        onChange={(e) => handleQtyChange(it.product, e.target.value)}
                        style={{ width: 80, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.6)" }}
                        disabled={saving}
                      />
                    </td>

                    <td style={{ padding: 12 }}>₹ {(it.qty * it.price).toLocaleString()}</td>

                    <td style={{ padding: 12 }}>
                      <button onClick={() => handleRemove(it.product)} disabled={saving} style={{ padding: "6px 10px", borderRadius: 8 }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ border: "1px solid rgba(148,163,184,0.6)", borderRadius: 12, padding: 12 }}>
            <h3>Order summary</h3>
            <p>Subtotal: ₹ {subtotal.toLocaleString()}</p>
            <p>Tax (12%): ₹ {tax.toLocaleString()}</p>
            <p>Shipping: ₹ {shipping.toLocaleString()}</p>
            <hr />
            <p style={{ fontWeight: 700 }}>Total: ₹ {total.toLocaleString()}</p>
            <button style={{ width: "100%", marginTop: 12 }} onClick={() => navigate("/checkout")}>
              Proceed to checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  color: "#9ca3af",
  fontSize: 14,
};

export default Cart;
