// server/src/controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

// Helper: create JWT token for a user
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Helper: send token in httpOnly cookie + user data in JSON
const sendTokenResponse = (user, statusCode, res) => {
  const token = createToken(user._id);

  const isProd = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProd, // true only in HTTPS/production
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie("token", token, cookieOptions);

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    vendorVerified: user.vendorVerified,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const allowedRoles = ["customer", "vendor", "admin"];
    let finalRole = role;
    if (!finalRole || !allowedRoles.includes(finalRole)) {
      finalRole = "customer";
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Signup error:", error);

    // Handle Mongoose validation errors nicely (e.g., password too short)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key error as a fallback (in case unique index triggers)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: "Server error during signup",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Logout user (clear cookie)
// @route   POST /api/auth/logout
// @access  Public
exports.logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  res.status(200).json({
    success: true,
    user: req.user,
  });
};
