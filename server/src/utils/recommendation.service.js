// server/src/utils/recommendation.service.js
const Product = require("../models/Product.model");
const User = require("../models/User.model");
const { cosineSimilarity } = require("./embedding.util"); // you already have this
const mongoose = require("mongoose");

/**
 * Hybrid similarity between two products:
 * - imageSim: cosine(imageEmbedding)
 * - textSim: cosine(textEmbedding)
 * - categoryMatch: +boost
 * - priceProximity: gaussian-like score
 *
 * weights configurable
 */
const DEFAULT_WEIGHTS = {
  image: 0.6,
  text: 0.3,
  categoryBoost: 0.08,
  priceDecay: 0.5, // how steep price penalty is
};

function priceProximityScore(p1Price, p2Price) {
  if (p1Price == null || p2Price == null) return 0;
  const diff = Math.abs(p1Price - p2Price);
  const maxPrice = Math.max(1, Math.max(p1Price, p2Price));
  // simple inverse relative distance
  const rel = 1 - Math.min(1, diff / maxPrice);
  return rel;
}

async function getSimilarProducts(productId, opts = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...(opts.weights || {}) };
  const k = opts.k || 12;

  const base = await Product.findById(productId).lean();
  if (!base) return [];

  // candidate query: same category or similar price band -> increase relevance + performance
  const price = base.price || 0;
  const minPrice = Math.max(0, price * 0.5);
  const maxPrice = price * 1.5;

  const candidates = await Product.find({
    _id: { $ne: mongoose.Types.ObjectId(productId) },
    isActive: true,
    $or: [
      { category: base.category },
      { price: { $gte: minPrice, $lte: maxPrice } },
    ],
  })
    .limit(1000) // limit scan size
    .lean();

  const scored = candidates.map((cand) => {
    let imageSim = 0,
      textSim = 0;

    if (Array.isArray(base.imageEmbedding) && Array.isArray(cand.imageEmbedding) && base.imageEmbedding.length && cand.imageEmbedding.length) {
      imageSim = cosineSimilarity(base.imageEmbedding, cand.imageEmbedding);
    }
    if (Array.isArray(base.textEmbedding) && Array.isArray(cand.textEmbedding) && base.textEmbedding.length && cand.textEmbedding.length) {
      textSim = cosineSimilarity(base.textEmbedding, cand.textEmbedding);
    }

    // category boost
    const categoryScore = base.category === cand.category ? 1 : 0;

    // price proximity
    const priceScore = priceProximityScore(base.price, cand.price);

    const hybridScore = weights.image * imageSim + weights.text * textSim + weights.categoryBoost * categoryScore + weights.priceDecay * priceScore;

    return { product: cand, score: hybridScore, imageSim, textSim, priceScore };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k);
}

/**
 * Compute user's profile embedding (mean of N last interacted product embeddings)
 * interactionTypes: ['view','purchase','wishlist'] with optional weights
 */
async function computeUserEmbedding(userId, opts = {}) {
  const limit = opts.limit || 50;
  // We assume you log interactions in a collection or the user doc has an array
  // If you don't have interaction logs, use orders and recently viewed list.
  const user = await User.findById(userId).lean();
  if (!user) return null;

  // gather productIds: prefer stored `recentlyViewed` or `history` fields in user doc
  const ids = (user.recentlyViewed || []).slice(0, limit).map((x) => mongoose.Types.ObjectId(x));
  // fallback: use user's orders, wishlist, etc.
  if (ids.length === 0 && user.purchases && user.purchases.length) {
    user.purchases.slice(-limit).forEach((p) => ids.push(mongoose.Types.ObjectId(p.product)));
  }
  if (ids.length === 0) return null;

  const products = await Product.find({ _id: { $in: ids }, isActive: true }).lean();
  if (!products || products.length === 0) return null;

  // compute average embedding (prefer imageEmb then textEmb)
  let vectors = [];
  products.forEach((p) => {
    if (Array.isArray(p.imageEmbedding) && p.imageEmbedding.length) vectors.push(p.imageEmbedding);
    else if (Array.isArray(p.textEmbedding) && p.textEmbedding.length) vectors.push(p.textEmbedding);
  });

  if (vectors.length === 0) return null;

  const dim = vectors[0].length;
  const avg = new Array(dim).fill(0);
  vectors.forEach((v) => {
    for (let i = 0; i < dim; i++) avg[i] += v[i] || 0;
  });
  for (let i = 0; i < dim; i++) avg[i] /= vectors.length;

  return avg;
}

/**
 * Recommend products for a user by comparing user embedding to product embeddings
 * fallback: trending list if user embedding missing
 */
async function recommendForUser(userId, opts = {}) {
  const k = opts.k || 12;
  const userEmbed = await computeUserEmbedding(userId, { limit: opts.limit || 50 });
  if (!userEmbed) {
    // fallback: trending
    const trending = await getTrendingProducts({ limit: k });
    return trending.map((p) => ({ product: p, reason: "trending" }));
  }

  // sample candidate products (exclude user's own vendor items if needed)
  const candidates = await Product.find({ isActive: true }).limit(2000).lean(); // tune for scale

  const scored = candidates.map((cand) => {
    // compute similarity against candidate's embeddings (prefer image then text)
    let candEmbed = null;
    if (Array.isArray(cand.imageEmbedding) && cand.imageEmbedding.length) candEmbed = cand.imageEmbedding;
    else if (Array.isArray(cand.textEmbedding) && cand.textEmbedding.length) candEmbed = cand.textEmbedding;
    if (!candEmbed) return { product: cand, score: 0 };
    const score = cosineSimilarity(userEmbed, candEmbed);
    return { product: cand, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map((s) => ({ product: s.product, score: s.score }));
}

/**
 * Trending products — simple popularity score computed from DB fields
 */
async function getTrendingProducts(opts = {}) {
  const limit = opts.limit || 12;
  // popularityScore already computed on Product (views/cart/purchase)
  const list = await Product.find({ isActive: true }).sort({ popularityScore: -1, viewsCount: -1, createdAt: -1 }).limit(limit).lean();
  return list;
}

module.exports = {
  getSimilarProducts,
  computeUserEmbedding,
  recommendForUser,
  getTrendingProducts,
};
