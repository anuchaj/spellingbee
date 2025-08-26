// server/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    account_type: {
      type: String,
      enum: ["admin", "student", "participant", "moderator"],
      default: "student",
    },
    // Fields for password reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.generatePasswordReset = function () {
  // Create random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash it and save to DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiration time (1 hour from now)
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

  return resetToken; // Return plain token for emailing
};

module.exports = mongoose.model("User", userSchema);
