/**
 * Create or update an instructor user (JWT login via email — instructor portal).
 *
 *   INSTRUCTOR_EMAIL=tutor@example.com INSTRUCTOR_PASSWORD='secret' INSTRUCTOR_NAME='Jane Tutor' node scripts/seed-instructor.js
 *
 * Optional: INSTRUCTOR_PHONE, INSTRUCTOR_BIO, INSTRUCTOR_SPECIALTIES (comma-separated),
 * INSTRUCTOR_ASSIGNED_COURSES (comma-separated course slugs, e.g. scratch,python).
 *
 * Local mock (never in production):
 *   npm run seed:instructor:mock
 *   MOCK_INSTRUCTOR=1 node scripts/seed-instructor.js
 */
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const User = require("../models/User");

const MOCK_DEFAULTS = {
  email: "instructor@stemtechlab.local",
  password: "InstructorMock1!",
  name: "Mock Instructor",
  phone: "+966509876543",
  bio: "Demo instructor for local testing — programming and robotics.",
  specialties: ["programming", "robotics"],
  assignedCourses: ["scratch", "python", "algo-intro"],
};

function parseList(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,|]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function main() {
  const useMock =
    process.env.MOCK_INSTRUCTOR === "1" ||
    process.env.MOCK_INSTRUCTOR === "true";

  if (useMock && process.env.NODE_ENV === "production") {
    console.error("MOCK_INSTRUCTOR is not allowed when NODE_ENV=production.");
    process.exit(1);
  }

  let email = process.env.INSTRUCTOR_EMAIL?.trim().toLowerCase();
  let password = process.env.INSTRUCTOR_PASSWORD;
  let name = process.env.INSTRUCTOR_NAME?.trim();
  let phone = process.env.INSTRUCTOR_PHONE?.trim();
  let bio = process.env.INSTRUCTOR_BIO?.trim();
  let specialties = parseList(process.env.INSTRUCTOR_SPECIALTIES);
  let assignedCourses = parseList(process.env.INSTRUCTOR_ASSIGNED_COURSES);

  if (useMock) {
    if (!email) email = MOCK_DEFAULTS.email;
    if (!password) password = MOCK_DEFAULTS.password;
    if (!name) name = MOCK_DEFAULTS.name;
    if (!phone) phone = MOCK_DEFAULTS.phone;
    if (!bio) bio = MOCK_DEFAULTS.bio;
    if (specialties.length === 0) specialties = [...MOCK_DEFAULTS.specialties];
    if (assignedCourses.length === 0) {
      assignedCourses = [...MOCK_DEFAULTS.assignedCourses];
    }
    console.warn(
      "[seed-instructor] MOCK_INSTRUCTOR: using local-only credentials (change in production)."
    );
    console.warn(`  Email: ${email}  Password: ${password}`);
  }

  if (!email || !password || !name) {
    console.error(
      "Set INSTRUCTOR_EMAIL, INSTRUCTOR_PASSWORD, and INSTRUCTOR_NAME in .env — or run MOCK_INSTRUCTOR=1 for local mock defaults."
    );
    process.exit(1);
  }

  if (String(password).length < 6) {
    console.error("INSTRUCTOR_PASSWORD must be at least 6 characters.");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === "admin") {
      console.error(
        `[seed-instructor] Refusing to change role: ${email} is already an admin. Use a different INSTRUCTOR_EMAIL.`
      );
      await mongoose.disconnect();
      process.exit(1);
    }
    existing.role = "instructor";
    existing.name = name;
    existing.password = password;
    if (phone) existing.phone = phone;
    if (bio !== undefined && bio !== "") existing.bio = bio;
    existing.specialties = specialties;
    existing.assignedCourses = assignedCourses;
    await existing.save();
    console.log("Updated existing user as instructor:", email);
  } else {
    await User.create({
      name,
      email,
      password,
      role: "instructor",
      phone: phone || undefined,
      bio: bio || undefined,
      specialties,
      assignedCourses,
    });
    console.log("Created instructor user:", email);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
