const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  word: { type: String, required: true },
  definition: { type: String, required: true }
});

module.exports = mongoose.model("Question", questionSchema);
