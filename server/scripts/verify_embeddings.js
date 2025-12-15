require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Product = require("../src/models/Product.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/visual-product-search";

(async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  const total = await Product.countDocuments();
  const withImageEmb = await Product.countDocuments({
    imageEmbedding: { $exists: true, $ne: [] },
  });

    console.log("Total products:", total);
    console.log("Products with image embeddings:", withImageEmb);
  } catch (err) {
    console.error("verify_embeddings ERROR:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
