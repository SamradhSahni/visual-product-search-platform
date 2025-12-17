const express = require("express");
const passport = require("passport");
const router = express.Router();

const {
  signup,
  login,
  logout,
  getCurrentUser,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");

/* ================================
   ✅ TEST ROUTE
================================ */
router.get("/test", (req, res) => {
  res.json({
    ok: true,
    route: "GET /api/auth/test is working",
  });
});

/* ================================
   ✅ EMAIL / PASSWORD AUTH
================================ */
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

/* ================================
   ✅ CURRENT USER
================================ */
router.get("/me", protect, getCurrentUser);

/* ================================
   🔐 GOOGLE OAUTH
================================ */

/**
 * STEP 1: Redirect user to Google
 * URL hit from frontend:
 * http://localhost:5000/api/auth/google
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * STEP 2: Google redirects back here
 * This URL MUST match Google Console callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
    session: true,
  }),
  (req, res) => {
    // ✅ Successful login
    // req.user is now available

    res.redirect("http://localhost:5173/");
  }
);

module.exports = router;
