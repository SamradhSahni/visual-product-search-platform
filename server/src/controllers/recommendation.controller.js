// server/src/controllers/recommendation.controller.js

const User = require("../models/User.model");
const Product = require("../models/Product.model");
const { cosineSimilarity } = require("../utils/embedding.util");
const {
  getSimilarProducts,
  recommendForUser,
  getTrendingProducts,
} = require("../utils/recommendation.service");

/**
 * Helper: compute normalized average embedding
 */
function averageEmbedding(vectors) {
  if (!Array.isArray(vectors) || vectors.length === 0) return [];

  const dim = vectors[0]?.length || 0;
  if (!dim) return [];

  const sum = new Array(dim).fill(0);
  let count = 0;

  for (const v of vectors) {
    if (!Array.isArray(v) || v.length !== dim) continue;
    for (let i = 0; i < dim; i++) sum[i] += Number(v[i]) || 0;
    count++;
  }

  if (!count) return [];

  for (let i = 0; i < dim; i++) sum[i] /= count;

  const norm = Math.sqrt(sum.reduce((a, b) => a + b * b, 0)) || 1;
  return sum.map((x) => x / norm);
}

/**
 * GET /api/recommendations/personalized
 * Cold-start safe personalized recommendations
 */
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id;
    const LIMIT = Number(req.query.limit || 12);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // -------------------------------
    // Build exclusion set
    // -------------------------------
    const excludedIds = new Set();

    (user.viewedProducts || []).forEach(v => {
      if (v?.product) excludedIds.add(v.product.toString());
    });

    (user.wishlist || []).forEach(w => {
      if (w?.product) excludedIds.add(w.product.toString());
    });

    // -------------------------------
    // Fetch viewed products
    // -------------------------------
    const viewedIds = (user.viewedProducts || [])
      .slice(0, 30)
      .map(v => v.product)
      .filter(Boolean);

    const viewedProducts = await Product.find({
      _id: { $in: viewedIds },
      isActive: true,
    }).lean();

    // -------------------------------
    // Collect embeddings
    // -------------------------------
    const vectors = viewedProducts
      .map(p => {
        if (Array.isArray(p.imageEmbedding) && p.imageEmbedding.length) return p.imageEmbedding;
        if (Array.isArray(p.textEmbedding) && p.textEmbedding.length) return p.textEmbedding;
        return null;
      })
      .filter(Boolean);

    // -------------------------------
    // 🔥 COLD START → TRENDING
    // -------------------------------
    if (vectors.length === 0) {
      const trending = await Product.find({ isActive: true })
        .sort({ popularityScore: -1, createdAt: -1 })
        .limit(LIMIT)
        .lean();

      return res.json({
        success: true,
        products: trending,
        coldStart: true,
      });
    }

    const avgEmbedding = averageEmbedding(vectors);
    if (!avgEmbedding.length) {
      const trending = await Product.find({ isActive: true })
        .sort({ popularityScore: -1 })
        .limit(LIMIT)
        .lean();

      return res.json({
        success: true,
        products: trending,
        coldStart: true,
      });
    }

    // -------------------------------
    // Candidate pool
    // -------------------------------
    const categories = new Set(viewedProducts.map(p => p.category).filter(Boolean));

    const candidateQuery = {
      isActive: true,
      _id: { $nin: Array.from(excludedIds) },
      $or: [
        { imageEmbedding: { $exists: true, $ne: [] } },
        { textEmbedding: { $exists: true, $ne: [] } },
      ],
    };

    if (categories.size > 0) {
      candidateQuery.category = { $in: Array.from(categories) };
    }

    const candidates = await Product.find(candidateQuery).limit(200).lean();

    // -------------------------------
    // Similarity scoring
    // -------------------------------
    const scored = candidates.map(p => {
      const v =
        (Array.isArray(p.imageEmbedding) && p.imageEmbedding.length)
          ? p.imageEmbedding
          : p.textEmbedding || [];

      const score = v.length ? cosineSimilarity(avgEmbedding, v) : 0;
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const MIN_RESULTS = 3;
    let SIM_THRESHOLD = 0.35;

    let filtered = scored.filter(s => s.score >= SIM_THRESHOLD);

    if (filtered.length < MIN_RESULTS) {
      SIM_THRESHOLD = 0.25;
      filtered = scored.filter(s => s.score >= SIM_THRESHOLD);
    }

    // -------------------------------
    // FINAL FALLBACK
    // -------------------------------
    if (filtered.length === 0) {
      const trending = await Product.find({ isActive: true })
        .sort({ popularityScore: -1 })
        .limit(LIMIT)
        .lean();

      return res.json({
        success: true,
        products: trending,
        fallback: "TRENDING",
      });
    }

    const results = filtered.slice(0, LIMIT).map(s => ({
      ...s.product,
      _score: s.score,
    }));

    return res.json({
      success: true,
      products: results,
    });

  } catch (error) {
    console.error("getPersonalizedRecommendations error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/recommendations/similar/:id
 */
exports.similarProducts = async (req, res) => {
  try {
    const productId = req.params.id;
    const k = Number(req.query.k || 12);

    const rows = await getSimilarProducts(productId, { k });

    res.json({
      success: true,
      products: rows.map(r => ({
        ...r.product,
        _score: r.score,
      })),
    });
  } catch (err) {
    console.error("similarProducts error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/recommendations/user
 */
exports.recommendForUser = async (req, res) => {
  try {
    const userId = req.params.id || req.user?._id;
    const k = Number(req.query.k || 12);

    const rows = await recommendForUser(userId, { k });

    res.json({
      success: true,
      products: rows.map(r => ({
        ...r.product,
        _score: r.score || 0,
      })),
    });
  } catch (err) {
    console.error("recommendForUser error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/recommendations/trending
 */
exports.trending = async (req, res) => {
  try {
    const k = Number(req.query.k || 12);
    const rows = await getTrendingProducts({ limit: k });

    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("trending error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
