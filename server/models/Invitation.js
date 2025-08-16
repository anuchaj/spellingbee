// server/models/Invitation.js
const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  contest: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", required: true },
  email: { type: String, required: true },
  token: { type: String, required: true }, // random string
  status: { type: String, enum: ["pending","accepted","declined"], default: "pending" },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Invitation", invitationSchema);