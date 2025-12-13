// server/scripts/bulk_sync_fetch_remote.js
// Usage: node scripts/bulk_sync_fetch_remote.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Product = require("../src/models/Product.model");
const { embedImageBuffer, addVector } = require("../src/utils/ml.service");
require("dotenv").config();

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/yourdb";
const BACKEND_BASE = process.env.BACKEND_BASE || "http://localhost:5000";
const UPLOADS_DIR = path.join(__dirname, "../../uploads/product_images");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function localPathFromImageUrl(imageUrl) {
  // imageUrl examples: /uploads/product_images/xxx.webp
  const rel = imageUrl.replace(/^\/+/, ""); // remove leading slash
  return path.join(__dirname, "../../", rel);
}

async function downloadToLocal(url, outPath) {
  try {
    const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(outPath, Buffer.from(resp.data));
    return true;
  } catch (e) {
    console.warn("download failed:", url, e.message || e);
    return false;
  }
}

async function main() {
  await mongoose.connect(MONGO);
  console.log("Connected to Mongo:", MONGO);

  const products = await Product.find({}).lean();
  console.log("Products:", products.length);

  let indexed = 0;
  for (const p of products) {
    const imageCandidates = [];
    if (p.imageUrl) imageCandidates.push(p.imageUrl);
    if (Array.isArray(p.images)) imageCandidates.push(...p.images);
    // dedupe
    const uniq = Array.from(new Set(imageCandidates.filter(Boolean)));
    if (uniq.length === 0) {
      console.log("[SKIP] no image fields for", p._id.toString());
      continue;
    }

    let indexedThis = false;
    for (const cand of uniq) {
      // try local path first
      const localPath = localPathFromImageUrl(cand);
      if (fs.existsSync(localPath)) {
        console.log("[FOUND local]", p._id.toString(), localPath);
        try {
          const buffer = fs.readFileSync(localPath);
          const embResp = await embedImageBuffer(buffer);
          if (embResp && embResp.success && Array.isArray(embResp.embedding)) {
            await addVector(p._id.toString(), embResp.embedding);
            console.log("[INDEXED local]", p._id.toString());
            indexed++;
            indexedThis = true;
            break;
          }
        } catch (err) {
          console.error("[ERR local embed]", p._id.toString(), err.message || err);
        }
      } else {
        // try downloading from backend URL
        // build full URL: BACKEND_BASE + cand
        const url = cand.startsWith("http") ? cand : (BACKEND_BASE.replace(/\/$/, "") + cand);
        const outFilename = path.basename(cand);
        const outPath = path.join(UPLOADS_DIR, outFilename);
        console.log("[TRY download]", url, "->", outPath);
        const ok = await downloadToLocal(url, outPath);
        if (!ok) {
          console.log("[DOWNLOAD FAIL]", url);
          continue;
        }
        // now index downloaded file
        try {
          const buffer = fs.readFileSync(outPath);
          const embResp = await embedImageBuffer(buffer);
          if (embResp && embResp.success && Array.isArray(embResp.embedding)) {
            await addVector(p._id.toString(), embResp.embedding);
            console.log("[INDEXED downloaded]", p._id.toString());
            indexed++;
            indexedThis = true;
            break;
          }
        } catch (err) {
          console.error("[ERR downloaded embed]", p._id.toString(), err.message || err);
        }
      }
    } // candidates loop

    if (!indexedThis) {
      console.log("[NOT INDEXED]", p._id.toString());
    }
  }

  console.log("Done. Indexed:", indexed);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
