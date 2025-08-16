// server/routes/contestRoutes.js
const router = require("express").Router();
const crypto = require("crypto");
const Contest = require("../models/Contest");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware"); // sets req.user

// Create contest (becomes moderator)
router.post("/", auth, async (req, res) => {
  try {
    const contest = await Contest.create({ moderator: req.user._id, mode: "offline" });
    res.json(contest);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get contest (state)
router.get("/:id", auth, async (req, res) => {
  const contest = await Contest.findById(req.params.id)
    .populate("participants.user", "name email")
    .populate("questions");
  if (!contest) return res.status(404).json({ error: "Not found" });
  res.json(contest);
});

// Enable online mode (moderator only)
router.post("/:id/online", auth, async (req, res) => {
  const c = await Contest.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  if (String(c.moderator) !== String(req.user._id)) return res.status(403).json({ error: "Forbidden" });
  c.mode = "online";
  await c.save();
  res.json({ ok: true });
});

// Invite by email
router.post("/:id/invite", auth, async (req, res) => {
  const { email } = req.body;
  const c = await Contest.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  if (String(c.moderator) !== String(req.user._id)) return res.status(403).json({ error: "Forbidden" });

  const token = crypto.randomBytes(16).toString("hex");
  const inv = await Invitation.create({ contest: c._id, email, token, invitedBy: req.user._id });

  // Optional: if user already exists, pre-add as invited participant
  const existing = await User.findOne({ email }).select("_id");
  if (existing && !c.participants.find(p => String(p.user) === String(existing._id))) {
    c.participants.push({ user: existing._id, status: "invited" });
    await c.save();
  }
  res.json({ invitation: inv });
});

// Accept invite (authed user)
router.post("/:id/accept-invite", auth, async (req, res) => {
  const { token } = req.body;
  const inv = await Invitation.findOne({ contest: req.params.id, token, status: "pending" });
  if (!inv) return res.status(400).json({ error: "Invalid invite" });

  inv.status = "accepted";
  await inv.save();

  const c = await Contest.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Contest not found" });

  const exists = c.participants.find(p => String(p.user) === String(req.user._id));
  if (!exists) c.participants.push({ user: req.user._id, status: "accepted" });
  await c.save();

  res.json({ ok: true });
});

// Start / End (moderator)
router.post("/:id/start", auth, async (req, res) => {
  const c = await Contest.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  if (String(c.moderator) !== String(req.user._id)) return res.status(403).json({ error: "Forbidden" });

  c.startedAt = new Date();
  c.currentQuestionIndex = 0;
  await c.save();
  res.json({ ok: true });
});

router.post("/:id/end", auth, async (req, res) => {
  const c = await Contest.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  if (String(c.moderator) !== String(req.user._id)) return res.status(403).json({ error: "Forbidden" });
  c.endedAt = new Date();
  await c.save();
  res.json({ ok: true });
});

module.exports = router;
