/**
 * Smoke-test POST /api/team/upload (admin JWT + tiny PNG).
 * Run from stem-Be: node scripts/test-team-photo-upload.js
 * Requires MONGODB_URI, JWT_SECRET, and at least one admin user in the DB.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const path = require("path");
const { createApp } = require(path.join(__dirname, "..", "createApp"));
const User = require(path.join(__dirname, "..", "models", "User"));
const { isCloudinaryConfigured } = require(path.join(
  __dirname,
  "..",
  "config",
  "cloudinary"
));

const MIN_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function main() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error("Missing MONGODB_URI or JWT_SECRET in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const admin = await User.findOne({
    role: "admin",
    isActive: { $ne: false },
  }).lean();

  if (!admin) {
    console.error("No active admin user found. Run seed:admin or seed:users.");
    process.exit(1);
  }

  const token = jwt.sign(
    { id: String(admin._id), role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const app = createApp();
  const res = await request(app)
    .post("/api/team/upload")
    .set("Authorization", `Bearer ${token}`)
    .attach("photo", MIN_PNG, "test.png");

  await mongoose.disconnect();

  if (res.status !== 201) {
    console.error("Upload failed:", res.status, res.body);
    process.exit(1);
  }

  const { photoUrl, photoPublicId } = res.body;
  if (!photoUrl || typeof photoUrl !== "string") {
    console.error("Missing photoUrl in response:", res.body);
    process.exit(1);
  }

  if (isCloudinaryConfigured()) {
    if (!photoUrl.includes("res.cloudinary.com")) {
      console.error(
        "Cloudinary is configured but photoUrl is not a Cloudinary URL:",
        photoUrl
      );
      process.exit(1);
    }
    if (!photoPublicId) {
      console.warn("Warning: empty photoPublicId (Cloudinary mode)");
    }
  } else if (!photoUrl.startsWith("/uploads/team/")) {
    console.error("Local disk mode expected /uploads/team/ path, got:", photoUrl);
    process.exit(1);
  }

  console.log("PASS team photo upload");
  console.log("  mode:", isCloudinaryConfigured() ? "cloudinary" : "local disk");
  console.log("  photoUrl:", photoUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
