// controllers/authController.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

