// controllers/authController.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const crypto = require("crypto");
const nodemailer = require("nodemailer");


// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, account_type: user.account_type },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );
};

// @desc    Signup new user
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = new User({ name, email, password }); // account_type defaults to "student"
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        account_type: user.account_type
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        account_type: user.account_type
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// @desc    Update user name/password
// @route   PUT /api/auth/update
// @access  Private
exports.updateProfile = async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (password) user.password = password;

    await user.save();

    res.status(200).json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};


// ✅ Add getProfile controller
exports.getProfile = async (req, res) => {
  try {
    const user = req.user; // Already fetched by isAuth middleware
    res.json({
      name: user.name,
      email: user.email,
      account_type: user.account_type,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// @desc    Request password reset (send email with link)
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user with that email" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Build reset URL
    const resetURL = `${req.protocol}://${req.get("host")}/new-password.html?token=${resetToken}`;

    // TODO: setup nodemailer transport properly
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      html: `<p>You requested a password reset</p>
             <p>Click this link to reset your password:</p>
             <a href="${resetURL}">${resetURL}</a>`,
    });

    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // not expired
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resetting password" });
  }
};

