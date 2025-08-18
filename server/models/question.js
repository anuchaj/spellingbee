// model/question.js

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  word: { type: String, required: true },
  definition: { type: String, required: true },
  sentence: {type: String, required: true},
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
});

module.exports = mongoose.model("question", questionSchema);
