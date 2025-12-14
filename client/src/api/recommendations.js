import api from "./axios";

export const getSimilarProducts = async (productId, k = 12) => {
  const res = await api.get(`/recommendations/product/${productId}/similar?k=${k}`);
  return res.data;
};

export const getUserRecommendations = async (userId, k = 12) => {
  // if you want current user, omit userId and call protected endpoint
  const res = await api.get(`/recommendations/user/${userId}?k=${k}`);
  return res.data;
};

export const getTrending = async (k = 12) => {
  const res = await api.get(`/recommendations/trending?k=${k}`);
  return res.data;
};
