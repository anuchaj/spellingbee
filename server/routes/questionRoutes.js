const express = require("express");
const router = express.Router();
const {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion
} = require("../controllers/questionController");

router.get("/", getQuestions);
router.post("/", addQuestion);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

module.exports = router;
