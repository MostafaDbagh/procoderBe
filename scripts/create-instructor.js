/**
 * One-time script: create Mostafa Dbagh instructor account.
 * Run: node scripts/create-instructor.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: "mostafa@stemtechlab.com" });
  if (existing) {
    console.log(`User already exists (role: ${existing.role}, name: ${existing.name}). Updating to instructor...`);
    existing.name = "Mostafa Dbagh";
    existing.role = "instructor";
    existing.isActive = true;
    existing.password = "Ca34@Dmh56"; // will be hashed by pre-save hook
    existing.specialties = existing.specialties?.length ? existing.specialties : ["programming", "STEM"];
    await existing.save();
    console.log("Updated existing user to instructor.");
  } else {
    await User.create({
      name: "Mostafa Dbagh",
      email: "mostafa@stemtechlab.com",
      password: "Ca34@Dmh56",
      role: "instructor",
      isActive: true,
      specialties: ["programming", "STEM"],
      bio: "STEM instructor at StemTechLab.",
      assignedCourses: [],
    });
    console.log("Created instructor: mostafa@stemtechlab.com");
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
