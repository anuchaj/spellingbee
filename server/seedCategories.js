const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Category = require("./models/Category");

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Category.deleteMany();

  await Category.insertMany([
    { name: "Random", description: "General words", isDefault: true },
    { name: "Medical", description: "Medical terms" },
    { name: "Construction", description: "Construction words" },
    { name: "Sports", description: "Sports-related vocabulary" },
    { name: "Computer", description: "Computer and tech terms" }
  ]);

  console.log("✅ Categories seeded.");
  process.exit();
};

seed();
