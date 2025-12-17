// server/src/middleware/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// -------- Search images (for /api/search/image) --------
// Use memory storage for search images (do not persist to disk)
const searchStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const uploadSearchImage = multer({
  storage: searchStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single("image"); // field: 'image'

// -------- Product images (for vendor products) --------
const PRODUCT_UPLOAD_DIR = path.join(__dirname, "../../uploads/product_images");
if (!fs.existsSync(PRODUCT_UPLOAD_DIR)) {
  fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
}

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PRODUCT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `product-${unique}${ext}`);
  },
});

const uploadProductImage = multer({
  storage: productStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single("image"); // field: 'image'

module.exports = { uploadSearchImage, uploadProductImage, PRODUCT_UPLOAD_DIR };
