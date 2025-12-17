// server/src/routes/recommendation.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getPersonalizedRecommendations } = require("../controllers/recommendation.controller");
const recCtrl = require("../controllers/recommendation.controller");

// GET /api/recommendations/personalized
router.get("/personalized", protect, getPersonalizedRecommendations);
router.get("/product/:id/similar", recCtrl.similarProducts);
router.get("/trending", recCtrl.trending);

// User recommendations (protected to get userId from token OR public if id param supplied)
router.get("/user/:id", protect, recCtrl.recommendForUser);

module.exports = router;
