//server/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

const { forgotPassword, resetPassword } = require("../controllers/authController");

// Update route
const { updateProfile } = require("../controllers/authController");
const { isAuth } = require("../middleware/authMiddleware");

// ✅ Add /api/auth/me route on the server
const { getProfile } = require("../controllers/authController");

// Signup route
router.post("/signup", signup);

// Login route
router.post("/login", login);

// Update route
router.put("/update", isAuth, updateProfile);

// My account route
router.get("/me", isAuth, getProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


module.exports = router;
