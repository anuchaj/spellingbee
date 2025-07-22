const fs = require("fs");
const path = require("path");
const Question = require("../models/question");

// ✅ Use this block for local file testing
const questionsFromFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../questions.json"), "utf-8")
);

// GET all questions
/*
const getQuestions = async (req, res) => {
  try {
    // Switch between file or DB
    return res.json(questionsFromFile); // <-- Uncomment to use local file
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load questions." });
  }
};
*/

// GET all questions
const getQuestions = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (category) filter.category = category;

    const questions = await Question.find(filter).populate("category");
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load questions." });
  }
};

// POST new question
const addQuestion = async (req, res) => {
  console.log("🔥 addQuestion called"); // ← ensure function is triggered
  console.log("📥 [addQuestion] Function called");
  console.log("📦 [addQuestion] Incoming body:", req.body); // <-- Most important!

  try {
    console.log("📦 Incoming body:", req.body); // ← this should show the payload

    const { word, definition, category } = req.body;
    const newQuestion = new Question({ word, definition, category });
    await newQuestion.save();

    res.status(201).json(newQuestion);
  } catch (err) {
    console.error("❌ Error saving question:", err);
    res.status(400).json({ error: "Failed to save question." });
  }
};

// PUT (update)
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Question.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Update failed." });
  }
};

// DELETE
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed." });
  }
};

module.exports = {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
};

