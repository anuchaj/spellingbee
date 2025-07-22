const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/authMiddleware");
const {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion
} = require("../controllers/questionController");

router.get("/", getQuestions);
router.post("/", requireAdmin, addQuestion);
router.put("/:id", requireAdmin, updateQuestion);
router.delete("/:id", requireAdmin, deleteQuestion);

module.exports = router;
