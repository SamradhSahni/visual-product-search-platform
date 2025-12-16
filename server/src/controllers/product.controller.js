// server/src/controllers/product.controller.js
const fs = require("fs");
const Product = require("../models/Product.model");
const path = require("path");
const {
  computeTextEmbedding,
  computePseudoImageEmbedding,
  cosineSimilarity,
} = require("../utils/embedding.util");

// ML service client
const {
  embedImageBuffer,
  addVector,
  removeVector,
} = require("../utils/ml.service");

// Popularity score: simple weighted sum
const computePopularityScore = (product) => {
  const views = product.viewsCount || 0;
  const carts = product.addToCartCount || 0;
  const purchases = product.purchaseCount || 0;

  // You can tune weights
  return views + 3 * carts + 5 * purchases;
};

/**
 * Helper: read local uploaded image file into Buffer
 * Accepts product.imageUrl like "/uploads/product_images/filename.jpg"
 */
function readImageBufferFromImageUrl(imageUrl) {
  try {
    // imageUrl expected to start with "/uploads"
    const uploadsDir = path.join(__dirname, "../../uploads");
    const relative = imageUrl.replace(/^\/uploads/, "");
    const fullPath = path.join(uploadsDir, relative);
    return fs.readFileSync(fullPath);
  } catch (err) {
    // if file not found or other error
    return null;
  }
}

/**
 * @desc    Create new product (vendor only)
 * @route   POST /api/products
 * @access  Private (vendor/admin)
 * Body: multipart/form-data
 *   fields: title, description, price, category, tags, stock
 *   file:   image (optional)
 */
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, tags, stock } = req.body;

    if (!title || !description || price == null || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, price and category are required",
      });
    }

    // 1) Text embedding
    const text = `${title} ${description}`;
    const textEmbedding = computeTextEmbedding(text);

    // 2) Image handling
    let imageUrl = null;
    let imageEmbedding = undefined;

    if (req.file) {
      // file saved by multer; path like: /.../uploads/product_images/filename.jpg
      const filename = req.file.filename;
      imageUrl = `/uploads/product_images/${filename}`;

      // compute pseudo image embedding initially (fast fallback)
      imageEmbedding = computePseudoImageEmbedding(req.file.path);
    }

    const tagsArray =
      typeof tags === "string"
        ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        : Array.isArray(tags)
          ? tags
          : [];

    const product = await Product.create({
      vendor: req.user._id,
      title,
      description,
      price,
      category,
      tags: tagsArray,
      stock: stock != null ? Number(stock) : 0,
      imageUrl,
      images: imageUrl ? [imageUrl] : [],
      textEmbedding,
      imageEmbedding,
    });

    // After product created, try to compute a real embedding via ML service and add vector
    try {
      if (product.imageUrl) {
        // read the file that was saved by multer
        const buffer = readImageBufferFromImageUrl(product.imageUrl) || (req.file && fs.readFileSync(req.file.path));

        if (buffer) {
          // 1) ask ML service for embedding
          const embResp = await embedImageBuffer(buffer);
          if (embResp && embResp.success && Array.isArray(embResp.embedding)) {
            product.imageEmbedding = embResp.embedding;
            await product.save();

            // 2) add to FAISS index (ML service)
            try {
              await addVector(product._id.toString(), embResp.embedding);
            } catch (e) {
              console.error("Failed to add vector to ML index for product", product._id, e.message || e);
            }
          } else {
            // If ML service did not return embedding, keep pseudo embedding already set
            console.warn("ML service returned no embedding for created product", product._id);
          }
        }
      }
    } catch (err) {
      console.error("Embedding/ML service error (createProduct):", err && (err.message || err));
      // Do not fail product creation because embedding failed
    }

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating product",
    });
  }
};

/**
 * @desc    Get similar products for a given product
 * @route   GET /api/products/:id/similar
 * @access  Public
 */
exports.getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit || 8);

    const baseProduct = await Product.findById(id).lean();
    if (!baseProduct || !baseProduct.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Prefer image embedding, fallback to text
    const baseEmbedding =
      Array.isArray(baseProduct.imageEmbedding) && baseProduct.imageEmbedding.length
        ? baseProduct.imageEmbedding
        : baseProduct.textEmbedding;

    if (!Array.isArray(baseEmbedding) || baseEmbedding.length === 0) {
      return res.json({ success: true, products: [] });
    }

    // Fetch candidate products (same category, exclude self)
    const candidates = await Product.find({
      _id: { $ne: baseProduct._id },
      category: baseProduct.category,
      isActive: true,
    }).lean();

    const SIMILARITY_THRESHOLD = 0.4;

    const scored = candidates
      .map((p) => {
        const emb =
          Array.isArray(p.imageEmbedding) && p.imageEmbedding.length
            ? p.imageEmbedding
            : p.textEmbedding;

        if (!Array.isArray(emb) || emb.length === 0) return null;

        const score = cosineSimilarity(baseEmbedding, emb);
        if (score < SIMILARITY_THRESHOLD) return null;

        return {
          ...p,
          _similarityScore: score,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b._similarityScore - a._similarityScore)
      .slice(0, limit);

    return res.json({
      success: true,
      products: scored,
    });
  } catch (err) {
    console.error("getSimilarProducts error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch similar products",
    });
  }
};

/**
 * @desc    Get trending products by popularityScore
 * @route   GET /api/products/trending/top
 * @access  Public
 */
exports.getTrendingProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 8);

    const products = await Product.find({ isActive: true })
      .populate("vendor", "name email role")
      .sort({ popularityScore: -1, viewsCount: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("getTrendingProducts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trending products",
    });
  }
};

/**
 * @desc    Register a product view (for analytics / trending)
 * @route   POST /api/products/:id/view
 * @access  Public
 */
exports.registerProductView = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false });
    }

    // Increment product metrics
    product.viewsCount = (product.viewsCount || 0) + 1;
    product.popularityScore = computePopularityScore(product);
    await product.save();

    // ✅ Update user embedding
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        const productEmbedding =
          product.imageEmbedding?.length
            ? product.imageEmbedding
            : product.textEmbedding;

        if (Array.isArray(productEmbedding) && productEmbedding.length) {
          if (!user.interactionEmbedding.length) {
            user.interactionEmbedding = productEmbedding;
          } else {
            // Running average
            user.interactionEmbedding = user.interactionEmbedding.map(
              (v, i) =>
                (v * user.interactionCount + productEmbedding[i]) /
                (user.interactionCount + 1)
            );
          }

          user.interactionCount += 1;
          await user.save();
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("registerProductView error:", err);
    res.status(500).json({ success: false });
  }
};

/**
 * @desc    Get all products (public, with basic filters)
 * @route   GET /api/products
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      vendor,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (vendor) {
      query.vendor = vendor;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate("vendor", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};

/**
 * @desc    Get single product by ID (public)
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "vendor",
      "name email role"
    );

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product by id error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching product",
    });
  }
};

/**
 * @desc    Get all products for current vendor (vendor dashboard)
 * @route   GET /api/products/my/products
 * @access  Private (vendor/admin)
 */
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get my products error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vendor products",
    });
  }
};

/**
 * @desc    Update product (vendor only, must own product)
 * @route   PUT /api/products/:id
 * @access  Private (vendor/admin)
 * Body: multipart/form-data
 *   fields: title, description, price, category, tags, stock, isActive (optional)
 *   file:   image (optional, replace existing)
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      product.vendor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this product",
      });
    }

    const fields = [
      "title",
      "description",
      "price",
      "category",
      "tags",
      "stock",
      "isActive",
    ];

    let title = product.title;
    let description = product.description;

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "tags") {
          product.tags =
            typeof req.body.tags === "string"
              ? req.body.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
              : Array.isArray(req.body.tags)
                ? req.body.tags
                : product.tags;
        } else if (field === "price" || field === "stock") {
          product[field] = Number(req.body[field]);
        } else if (field === "isActive") {
          product[field] = req.body[field] === "true" || req.body[field] === true;
        } else {
          product[field] = req.body[field];
        }

        if (field === "title") title = product[field];
        if (field === "description") description = product[field];
      }
    });

    // If title or description changed, recompute text embedding
    if (req.body.title !== undefined || req.body.description !== undefined) {
      const text = `${title} ${description}`;
      product.textEmbedding = computeTextEmbedding(text);
    }

    // If a new image file is provided, replace existing image and embedding
    if (req.file) {
      // delete old file (best-effort)
      if (product.imageUrl) {
        const oldPath = product.imageUrl.replace(
          "/uploads",
          path.join(__dirname, "../../uploads")
        );
        fs.unlink(oldPath, () => { });
      }

      const filename = req.file.filename;
      const newUrl = `/uploads/product_images/${filename}`;
      product.imageUrl = newUrl;
      product.images = [newUrl];

      // compute a pseudo embedding first
      product.imageEmbedding = computePseudoImageEmbedding(req.file.path);

      // attempt to compute a real embedding via ML service and update vector
      try {
        // remove previous vector from index (best-effort)
        if (product._id) {
          try {
            await removeVector(product._id.toString());
          } catch (e) {
            // log but continue
            console.warn("removeVector failed (update):", e && e.message ? e.message : e);
          }
        }

        const buffer = readImageBufferFromImageUrl(product.imageUrl) || (req.file && fs.readFileSync(req.file.path));
        if (buffer) {
          const embResp = await embedImageBuffer(buffer);
          if (embResp && embResp.success && Array.isArray(embResp.embedding)) {
            product.imageEmbedding = embResp.embedding;
            // save product first before calling addVector (ensures product._id exists)
            await product.save();
            try {
              await addVector(product._id.toString(), embResp.embedding);
            } catch (e) {
              console.error("Failed to addVector (updateProduct):", e && e.message ? e.message : e);
            }
          } else {
            console.warn("ML service returned no embedding on update for product", product._id);
          }
        }
      } catch (err) {
        console.error("Embedding error (updateProduct):", err && (err.message || err));
      }
    }

    const updated = await product.save();

    res.status(200).json({
      success: true,
      product: updated,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating product",
    });
  }
};

/**
 * @desc    Delete product (hard delete)
 * @route   DELETE /api/products/:id
 * @access  Private (vendor/admin)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      product.vendor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this product",
      });
    }

    // delete product image file if exists
    if (product.imageUrl) {
      const baseDir = path.join(__dirname, "../../uploads");
      const relativePath = product.imageUrl.replace("/uploads", "");
      const fullPath = path.join(baseDir, relativePath);
      fs.unlink(fullPath, () => { });
    }

    // Try to remove vector from ML index (best-effort)
    try {
      if (product._id) {
        await removeVector(product._id.toString());
      }
    } catch (err) {
      console.warn("removeVector failed (deleteProduct):", err && (err.message || err));
    }

    await Product.deleteOne({ _id: product._id });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting product",
    });
  }
};
