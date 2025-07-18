const Category = require("../models/Category");

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    res.json(categories);
  } catch (err) {
    // Send a 500 Internal Server Error with the error message if something goes wrong
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};


// Add a new category
const addCategory = async (req, res) => {
  try {
    const { name, description, isDefault } = req.body;
    const category = new Category({ name, description, isDefault });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: "Category creation failed" });
  }
};

module.exports = {
  getCategories,
  addCategory
};
