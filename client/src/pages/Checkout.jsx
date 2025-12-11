// client/src/pages/Checkout.jsx
import { useEffect, useState } from "react";
import { getCart } from "../api/cart";
import { createOrderFromCart, payOrder } from "../api/orders";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
    phone: "",
  });
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCart();
        if (data.success) setCart(data.cart);
      } catch (err) {
        console.error("load cart error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreateOrder = async () => {
    setCreating(true);
    try {
      const res = await createOrderFromCart(shipping);
      if (res.success) {
        // Immediately simulate payment (mock)
        const order = res.order;
        setCreating(false);
        // go to simulated payment screen
        navigate(`/orders/${order._id}`);
      } else {
        alert(res.message || "Failed to create order");
      }
    } catch (err) {
      console.error("create order error", err);
      alert("Failed to create order");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 24 }}>Loading checkout...</div>;
  if (!cart || cart.items.length === 0) return <div style={{ paddingTop: 24 }}>Cart empty. <a href="/browse">Browse</a></div>;

  const subtotal = cart.items.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
  const tax = Number((subtotal * 0.12).toFixed(2));
  const shippingCost = subtotal > 2000 ? 0 : 99;
  const total = Number((subtotal + tax + shippingCost).toFixed(2));

  return (
    <div style={{ paddingTop: 24 }}>
      <h1>Checkout</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        <div>
          <h3>Shipping address</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <input placeholder="Full name" value={shipping.name} onChange={(e) => setShipping(s => ({...s, name: e.target.value}))} />
            <input placeholder="Address line 1" value={shipping.line1} onChange={(e) => setShipping(s => ({...s, line1: e.target.value}))} />
            <input placeholder="Address line 2" value={shipping.line2} onChange={(e) => setShipping(s => ({...s, line2: e.target.value}))} />
            <input placeholder="City" value={shipping.city} onChange={(e) => setShipping(s => ({...s, city: e.target.value}))} />
            <input placeholder="State" value={shipping.state} onChange={(e) => setShipping(s => ({...s, state: e.target.value}))} />
            <input placeholder="Postal code" value={shipping.postalCode} onChange={(e) => setShipping(s => ({...s, postalCode: e.target.value}))} />
            <input placeholder="Phone" value={shipping.phone} onChange={(e) => setShipping(s => ({...s, phone: e.target.value}))} />
          </div>

          <h3 style={{ marginTop: 18 }}>Payment</h3>
          <p>This is a simulated payment. Click Pay to complete the order.</p>
          <button onClick={handleCreateOrder} disabled={creating} style={{ marginRight: 8 }}>
            {creating ? "Creating..." : `Create order & go to payment (₹ ${total.toLocaleString()})`}
          </button>
        </div>

        <div style={{ border: "1px solid rgba(148,163,184,0.6)", padding: 12, borderRadius: 8 }}>
          <h3>Order Summary</h3>
          <p>Items: {cart.items.length}</p>
          <p>Subtotal: ₹ {subtotal.toLocaleString()}</p>
          <p>Tax (12%): ₹ {tax.toLocaleString()}</p>
          <p>Shipping: ₹ {shippingCost.toLocaleString()}</p>
          <hr/>
          <p style={{ fontWeight: 700 }}>Total: ₹ {total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
