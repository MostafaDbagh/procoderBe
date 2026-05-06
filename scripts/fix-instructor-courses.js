/**
 * Migration: link all courses assigned to "Mostafa dbagh" (Team member or any User)
 * to the real instructor User account (mostafa@stemtechlab.com).
 *
 * Run: node scripts/fix-instructor-courses.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Team = require("../models/Team");
const Course = require("../models/Course");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // 1. Find the real instructor User
  const instructor = await User.findOne({ email: "mostafa@stemtechlab.com" });
  if (!instructor) {
    console.error("Instructor user not found for mostafa@stemtechlab.com");
    process.exit(1);
  }
  console.log(`Instructor User: ${instructor.name} (${instructor._id})`);

  // 2. Find ALL Team members whose name.en matches (case-insensitive)
  const nameLower = instructor.name.toLowerCase().trim();
  const allTeam = await Team.find({}).select("_id name").lean();
  const matchingTeamIds = allTeam
    .filter((t) => (t.name?.en || "").toLowerCase().trim() === nameLower)
    .map((t) => t._id);
  console.log(`Matching Team member IDs: ${matchingTeamIds.map(String).join(", ") || "none"}`);

  // 3. Find ALL other User accounts whose name matches (case-insensitive)
  const matchingUserIds = (await User.find({}).select("_id name").lean())
    .filter((u) => String(u._id) !== String(instructor._id) && (u.name || "").toLowerCase().trim() === nameLower)
    .map((u) => u._id);
  console.log(`Other matching User IDs: ${matchingUserIds.map(String).join(", ") || "none"}`);

  // 4. Find all courses that have any of those IDs in their instructors array
  const legacyIds = [...matchingTeamIds, ...matchingUserIds];
  const coursesToFix = await Course.find({
    instructors: { $in: legacyIds },
  }).select("slug title").lean();

  console.log(`\nCourses to fix (${coursesToFix.length}):`);
  coursesToFix.forEach((c) => console.log(`  - ${c.slug} (${c.title?.en || c.title})`));

  if (coursesToFix.length === 0) {
    console.log("\nNothing to fix.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // 5. For each course, add the real User ID to instructors (keep old IDs for backward compat)
  const courseSlugs = coursesToFix.map((c) => c.slug);
  const result = await Course.updateMany(
    { slug: { $in: courseSlugs } },
    { $addToSet: { instructors: instructor._id } }
  );
  console.log(`\nUpdated ${result.modifiedCount} course(s) — added instructor User ID.`);

  // 6. Also update User.assignedCourses with all those slugs
  const existingSlugs = new Set(instructor.assignedCourses || []);
  const newSlugs = courseSlugs.filter((s) => !existingSlugs.has(s));
  if (newSlugs.length > 0) {
    await User.updateOne(
      { _id: instructor._id },
      { $addToSet: { assignedCourses: { $each: newSlugs } } }
    );
    console.log(`Updated assignedCourses: added [${newSlugs.join(", ")}]`);
  } else {
    console.log("assignedCourses already up to date.");
  }

  console.log("\nDone. Restart the backend server.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
