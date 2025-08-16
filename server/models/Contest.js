// server/models/Contest.js
const mongoose = require("mongoose");

const participantSub = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["invited","accepted","declined","active"], default: "invited" },
  score: { type: Number, default: 0 }
}, { _id: false });

const contestSchema = new mongoose.Schema({
  title: { type: String, default: "Spelling Bee" },
  mode: { type: String, enum: ["offline","online"], default: "offline" },
  moderator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [participantSub],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "question" }],
  currentQuestionIndex: { type: Number, default: -1 },
  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Contest", contestSchema);
