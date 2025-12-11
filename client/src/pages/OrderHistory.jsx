// client/src/pages/OrderHistory.jsx
import { useEffect, useState } from "react";
import { getMyOrders } from "../api/orders";
import { Link } from "react-router-dom";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMyOrders();
        if (res.success) setOrders(res.orders || []);
      } catch (err) {
        console.error("getMyOrders error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  if (loading) return <div style={{ paddingTop: 24 }}>Loading orders...</div>;
  return (
    <div style={{ paddingTop: 24 }}>
      <h1>My orders</h1>
      {orders.length === 0 ? <p>You have no orders yet.</p> : (
        <ul>
          {orders.map((o) => (
            <li key={o._id}>
              <Link to={`/orders/${o._id}`}>Order {o._id}</Link> — ₹ {o.total} — {o.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderHistory;
