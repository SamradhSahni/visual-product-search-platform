// client/src/api/orders.js
import api from "./axios";

export const createOrderFromCart = async (shippingAddress = {}) => {
  const res = await api.post("/orders/create", { shippingAddress });
  return res.data;
};

export const payOrder = async (orderId, simulate = "success") => {
  const res = await api.post(`/orders/${orderId}/pay`, { simulate, method: "mock-card" });
  return res.data;
};

export const getMyOrders = async () => {
  const res = await api.get("/orders/my");
  return res.data;
};

export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};
