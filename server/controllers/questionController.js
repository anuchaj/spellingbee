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
  try {
    const { word, definition } = req.body;
    const newQ = new Question({ word, definition });
    await newQ.save();
    res.status(201).json(newQ);
  } catch (err) {
    res.status(400).json({ error: "Invalid data." });
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

