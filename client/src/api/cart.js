// client/src/api/cart.js
import api from "./axios";

export const getCart = async () => {
  const res = await api.get("/cart");
  return res.data;
};

export const addToCart = async (productId, qty = 1) => {
  const res = await api.post("/cart/add", { productId, qty });
  return res.data;
};

export const updateCartItem = async (productId, qty) => (await api.put("/cart/update", { productId, qty })).data;

export const removeCartItem = async (productId) => {
  const res = await api.post("/cart/remove", { productId });
  return res.data;
};

export const clearCart = async () => {
  const res = await api.post("/cart/clear");
  return res.data;
};
