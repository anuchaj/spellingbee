// models/Category.js

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category_name: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

module.exports = mongoose.model("Category", categorySchema);
