const axios = require("axios");
const FormData = require("form-data");
const Product = require("../models/Product.model");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8200";

const ml = axios.create({
  baseURL: ML_URL,
  timeout: 20000,
});

/**
 * Embed an image buffer using ML service
 * Returns: number[]
 */
async function embedImageBuffer(buffer) {
  const form = new FormData();
  form.append("image", buffer, {
    filename: "query.jpg",
    contentType: "image/jpeg",
  });

  const res = await ml.post("/embed-image", form, {
    headers: form.getHeaders(),
  });

  if (!res.data || !Array.isArray(res.data.embedding)) {
    throw new Error("Invalid embedding returned from ML service");
  }

  return res.data.embedding;
}

/**
 * Image search:
 * 1. Compute query embedding
 * 2. Fetch product embeddings from DB
 * 3. Send to ML service for similarity search
 */
async function searchByImageBuffer(buffer, k = 12) {
  // Step 1: Embed query image
  const queryEmbedding = await embedImageBuffer(buffer);

  // Step 2: Fetch product embeddings
  const products = await Product.find({
    isActive: true,
    imageEmbedding: { $exists: true, $ne: [] },
  })
    .select("_id imageEmbedding")
    .lean();

  if (!products.length) {
    return { success: true, results: [] };
  }

  // Step 3: Call ML similarity search
  const payload = {
    embedding: queryEmbedding,
    items: products.map((p) => ({
      productId: p._id.toString(),
      embedding: p.imageEmbedding,
    })),
  };

  const res = await ml.post(`/search?k=${k}`, payload);

  return res.data;
}

/**
 * Search using embedding directly (text / hybrid)
 */
async function searchByEmbedding(embedding, k = 12) {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Embedding must be a non-empty array");
  }

  const res = await ml.post(`/search?k=${k}`, { embedding });
  return res.data;
}

/**
 * Optional: register vector inside ML service (future use)
 */
async function addVector(productId, embedding) {
  const res = await ml.post("/add-vector", {
    productId,
    embedding,
  });
  return res.data;
}

/**
 * Optional: remove vector inside ML service (future use)
 */
async function removeVector(productId) {
  const res = await ml.post("/remove-vector", { productId });
  return res.data;
}

module.exports = {
  embedImageBuffer,
  searchByImageBuffer,
  searchByEmbedding,
  addVector,
  removeVector,
};
