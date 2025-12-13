const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

// Serve uploaded images statically

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const searchRoutes = require("./routes/search.routes");
const activityRoutes = require("./routes/activity.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");



const app = express();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS config – MUST match your frontend URL and enable credentials
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes – important: these prefixes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler – handle multer / busboy errors and other server errors
app.use((err, req, res, next) => {
  console.error("Global error handler:", err && err.message ? err.message : err);

  // busboy multipart errors (Unexpected end of form etc.)
  if (err && err.message && /Unexpected end of form/i.test(err.message)) {
    return res.status(400).json({ success: false, message: "Malformed multipart/form-data upload" });
  }

  // multer file size error
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large" });
  }

  // generic
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
