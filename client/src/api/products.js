// client/src/api/products.js
import api from "./axios";

// Helper to build multipart/form-data for product
const buildProductFormData = (payload, imageFile) => {
  const formData = new FormData();

  if (payload.title) formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  if (payload.price !== undefined && payload.price !== null)
    formData.append("price", String(payload.price));
  if (payload.category) formData.append("category", payload.category);
  if (payload.stock !== undefined && payload.stock !== null)
    formData.append("stock", String(payload.stock));
  if (payload.tags && Array.isArray(payload.tags) && payload.tags.length > 0) {
    // backend accepts comma-separated tags, easier to send like this
    formData.append("tags", payload.tags.join(","));
  }

  if (payload.isActive !== undefined) {
    formData.append("isActive", String(payload.isActive));
  }

  if (imageFile) {
    formData.append("image", imageFile);
  }

  return formData;
};

// Get products for current vendor
export const getMyProducts = async () => {
  const res = await api.get("/products/my/products");
  return res.data;
};

// Create new product (multipart/form-data)
export const createProduct = async (payload, imageFile) => {
  const formData = buildProductFormData(payload, imageFile);

  const res = await api.post("/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// Update product by id (multipart/form-data)
export const updateProduct = async (id, payload, imageFile) => {
  const formData = buildProductFormData(payload, imageFile);

  const res = await api.put(`/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// Hard delete product by id
export const deleteProduct = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

// PUBLIC: Get all products with filters
export const listProducts = async (params = {}) => {
  const res = await api.get("/products", { params });
  return res.data;
};

// PUBLIC: Get single product by ID
export const getProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};
export const registerProductView = async (id) => {
  try {
    await api.post(`/products/${id}/view`);
  } catch {
    // swallow errors – this is analytics only
  }
};

// Get similar products for a given product id
export const getSimilarProducts = async (id) => {
  const res = await api.get(`/products/${id}/similar`);
  return res.data;
};

// Get trending products (global)
export const getTrendingProducts = async (limit = 8) => {
  const res = await api.get("/products/trending/top", {
    params: { limit },
  });
  return res.data;
};
// Get personalized recommendations for current user
export const getPersonalizedRecommendations = async (limit = 8) => {
  const res = await api.get(`/recommendations/personalized?limit=${limit}`);
  return res.data;
};
