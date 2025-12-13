// server/scripts/list_products_debug.js
// Usage: node scripts/list_products_debug.js
const mongoose = require("mongoose");
const Product = require("../src/models/Product.model"); // adjust if your path differs
require("dotenv").config();
const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/yourdb";

async function main() {
  await mongoose.connect(MONGO);
  console.log("Connected to Mongo:", MONGO);

  const total = await Product.countDocuments({});
  console.log("Total products in collection:", total);

  const sample = await Product.find({}).limit(10).lean();
  console.log("Sample product documents (first 10):");
  sample.forEach((p, i) => {
    console.log("---- product", i+1, "id:", p._id.toString());
    // print a few useful fields
    console.log(" title:", p.title || "[no title]");
    console.log(" isActive:", p.isActive);
    console.log(" imageUrl:", p.imageUrl);
    console.log(" images:", Array.isArray(p.images) ? p.images.slice(0,3) : p.images);
    console.log(" other potential fields: image, photos, thumbnails present?:",
      !!p.image, !!p.photos, !!p.thumbnails);
    console.log(" textEmbedding exists?:", !!p.textEmbedding);
    console.log(" imageEmbedding exists?:", !!p.imageEmbedding);
    console.log(" vendor:", p.vendor ? p.vendor.toString() : p.vendor);
    console.log("");
  });

  // show aggregated counts for common image fields
  const cntImageUrl = await Product.countDocuments({ imageUrl: { $exists: true, $ne: null } });
  const cntImagesArr = await Product.countDocuments({ images: { $exists: true, $ne: [] } });
  const cntAny = await Product.countDocuments({
    $or: [
      { imageUrl: { $exists: true, $ne: null } },
      { images: { $exists: true, $ne: [] } },
      { image: { $exists: true, $ne: null } },
      { photos: { $exists: true, $ne: [] } },
    ]
  });
  console.log("Counts -> imageUrl:", cntImageUrl, " images[]:", cntImagesArr, " any image-like:", cntAny);

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error("ERR:", e);
  process.exit(1);
});
