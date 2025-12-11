// client/src/pages/OrderDetails.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrderById, payOrder } from "../api/orders";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getOrderById(id);
        if (res.success) setOrder(res.order);
      } catch (err) {
        console.error("getOrder error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePay = async (simulate = "success") => {
    setPaying(true);
    try {
      const res = await payOrder(id, simulate);
      if (res.success) {
        setOrder(res.order);
        alert("Payment successful (simulated).");
      } else {
        alert(res.message || "Payment failed.");
      }
    } catch (err) {
      console.error("payOrder error", err);
      alert("Payment failed (network).");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 24 }}>Loading order...</div>;
  if (!order) return <div style={{ paddingTop: 24 }}>Order not found.</div>;

  return (
    <div style={{ paddingTop: 24 }}>
      <h1>Order #{order._id}</h1>
      <p>Status: {order.status}</p>
      <h3>Items</h3>
      <ul>
        {order.items.map((it) => (
          <li key={it.product}>
            {it.title} x {it.qty} — ₹ {(it.price * it.qty).toLocaleString()}
          </li>
        ))}
      </ul>
      <p>Subtotal: ₹ {order.subtotal.toLocaleString()}</p>
      <p>Tax: ₹ {order.tax.toLocaleString()}</p>
      <p>Shipping: ₹ {order.shipping.toLocaleString()}</p>
      <h3>Total: ₹ {order.total.toLocaleString()}</h3>
      {order.status !== "paid" ? (
        <>
          <button onClick={() => handlePay("success")} disabled={paying}>
            {paying ? "Processing..." : "Pay now (simulate success)"}
          </button>
          <button onClick={() => handlePay("fail")} style={{ marginLeft: 8 }} disabled={paying}>
            {paying ? "Processing..." : "Simulate fail"}
          </button>
        </>
      ) : (
        <p>Paid at: {new Date(order.paidAt).toLocaleString()}</p>
      )}
    </div>
  );
};

export default OrderDetails;
