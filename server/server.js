// server/server.js

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const questionRoutes = require("./routes/questionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const authRoutes = require("./routes/authRoutes");
const cors = require('cors');

//New updates starts


dotenv.config(); // Load .env
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Static frontend
app.use(express.static(path.join(__dirname, "../public")));

// Auth
app.use("/api/auth", authRoutes);

// API routes
app.use("/api/questions", questionRoutes);

// Add route
app.use("/api/categories", categoryRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port http://localhost:${PORT}`));
