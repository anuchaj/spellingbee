const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/authMiddleware");
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

router.get("/", getCategories);
router.post("/", requireAdmin, addCategory);
router.put("/:id", requireAdmin, updateCategory);     // 👈 update category by ID
router.delete("/:id", requireAdmin, deleteCategory);  // 👈 delete category by ID

module.exports = router;
