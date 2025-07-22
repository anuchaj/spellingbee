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
    const { category_name, isDefault } = req.body;
    const category = new Category({ category_name, isDefault });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: "Category creation failed" });
  }
};


// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, isDefault } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { category_name, isDefault },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    res.status(400).json({ error: "Failed to update category" });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete category" });
  }
};

module.exports = {
  getCategories,
  addCategory,
  updateCategory, // 👈 export it
  deleteCategory  // 👈 export it
};
