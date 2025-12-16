// server/src/controllers/search.controller.js
const fs = require("fs");
const Product = require("../models/Product.model");
const { searchByImageBuffer, searchByEmbedding } = require("../utils/ml.service");

exports.searchByImage = async (req, res) => {
  try {
    console.log("===> searchByImage called");

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Image file missing or invalid",
      });
    }

    const k = Number(req.query.k || 12);

    const buffer = req.file.buffer;

    const mlResp = await searchByImageBuffer(buffer, k);

    if (!mlResp || !mlResp.success || !Array.isArray(mlResp.results)) {
      return res.status(200).json({
        success: true,
        products: [],
      });
    }

    const rawResults = mlResp.results[0] || [];
    if (rawResults.length === 0) {
      return res.status(200).json({
        success: true,
        products: [],
      });
    }

    const productIds = rawResults.map(r => r.productId);

    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).lean();

    const byId = {};
    products.forEach(p => {
      byId[p._id.toString()] = p;
    });

    const SIMILARITY_THRESHOLD = 0.40;

    const ordered = rawResults
      .map(r => {
        const p = byId[r.productId];
        if (!p) return null;

        const score = Number(r.score || 0);
        if (score < SIMILARITY_THRESHOLD) return null;

        return {
          ...p,
          similarity: score,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      products: ordered,
    });

  } catch (err) {
    console.error("searchByImage ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while searching image",
    });
  }
};
