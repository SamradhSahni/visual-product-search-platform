require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Product = require("../src/models/Product.model");
const { embedImageBuffer } = require("../src/utils/ml.service");

const MONGO_URI = process.env.MONGO_URI;

const UPLOADS_BASE = path.join(__dirname, "..", "uploads");

(async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected");

    console.log("📛 DB NAME:", mongoose.connection.name);
    console.log("📛 DB HOST:", mongoose.connection.host);

    // 🔥 NO FILTER FIRST
    const products = await Product.find({});
    console.log("📦 TOTAL PRODUCTS (NO FILTER):", products.length);

    let indexed = 0;
    let skipped = 0;

    for (const product of products) {
      try {
        const imagePathFromDb =
          product.imageUrl ||
          (Array.isArray(product.images) && product.images[0]);

        if (!imagePathFromDb) {
          skipped++;
          continue;
        }

        const imagePath = path.join(
          UPLOADS_BASE,
          imagePathFromDb.replace("/uploads", "")
        );

        if (!fs.existsSync(imagePath)) {
          console.log("❌ FILE NOT FOUND:", imagePath);
          skipped++;
          continue;
        }

        const buffer = fs.readFileSync(imagePath);
        const embedding = await embedImageBuffer(buffer);

        if (!embedding || !embedding.length) {
          skipped++;
          continue;
        }

        product.imageEmbedding = embedding;
        await product.save();

        indexed++;
        console.log("✅ Embedded:", product.title);
      } catch (e) {
        console.error("❌ Error:", e.message);
        skipped++;
      }
    }

    console.log("=================================");
    console.log("🎯 DONE");
    console.log("✅ Indexed:", indexed);
    console.log("⚠️ Skipped:", skipped);
    console.log("=================================");

    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal:", err);
    process.exit(1);
  }
})();
