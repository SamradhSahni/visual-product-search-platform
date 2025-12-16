const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

require("./config/passport"); // 🔥 IMPORTANT: load strategies

// Routes
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const searchRoutes = require("./routes/search.routes");
const activityRoutes = require("./routes/activity.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

/* =========================================
   📂 STATIC FILES (PRODUCT IMAGES)
========================================= */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

/* =========================================
   🌐 CORS (MUST allow credentials)
========================================= */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

/* =========================================
   📦 BODY PARSERS
========================================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================================
   🔐 EXPRESS SESSION (REQUIRED FOR PASSPORT)
========================================= */
app.use(
  session({
    name: "vps.sid",
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true only in HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

/* =========================================
   🛂 PASSPORT (ORDER IS CRITICAL)
========================================= */
app.use(passport.initialize());
app.use(passport.session());

/* =========================================
   🪵 LOGGER
========================================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================================
   🚏 ROUTES (AFTER PASSPORT)
========================================= */
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);        // ✅ ONLY ONE AUTH ROUTE
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/auth", authRoutes);

/* =========================================
   ❌ 404 HANDLER
========================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================================
   🚨 GLOBAL ERROR HANDLER
========================================= */
app.use((err, req, res, next) => {
  console.error("Global error handler:", err?.message || err);

  if (/Unexpected end of form/i.test(err?.message)) {
    return res.status(400).json({
      success: false,
      message: "Malformed multipart/form-data upload",
    });
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
