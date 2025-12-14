// client/src/api/activity.js
import api from "./axios";

// Record a product view for the current authenticated user
export const recordUserView = async (productId) => {
  const res = await api.post("/activity/view", { productId });
  return res.data;
};

// Wishlist
export const addToWishlist = async (productId) => {
  const res = await api.post("/activity/wishlist/add", { productId });
  return res.data;
};

export const removeFromWishlist = async (productId) => {
  const res = await api.post("/activity/wishlist/remove", { productId });
  return res.data;
};
