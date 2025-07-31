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
