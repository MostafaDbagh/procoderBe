const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { createApp } = require("../createApp");
const User = require("../models/User");
const Category = require("../models/Category");
const Course = require("../models/Course");

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const HAS_DB = Boolean(
  MONGODB_URI && JWT_SECRET && String(JWT_SECRET).length >= 16
);

/**
 * @param {(ctx: {
 *   app: import("express").Express;
 *   auth: { Authorization: string };
 *   admin: import("mongoose").Document;
 * }) => Promise<void>} fn
 */
async function runAsAdmin(fn) {
  await mongoose.connect(MONGODB_URI);
  const app = createApp();
  const admin = await User.create({
    name: "Admin Payload Validation",
    email: `admin-payload-${Date.now()}@test.local`,
    password: "testpassword123",
    role: "admin",
  });
  const token = jwt.sign(
    { id: admin._id.toString(), role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  const auth = { Authorization: `Bearer ${token}` };
  try {
    await fn({ app, auth, admin });
  } finally {
    await User.deleteOne({ _id: admin._id });
    await mongoose.disconnect();
  }
}

test(
  "POST /api/categories rejects invalid slug",
  { skip: !HAS_DB },
  async () => {
    await runAsAdmin(async ({ app, auth }) => {
      const res = await request(app)
        .post("/api/categories")
        .set(auth)
        .send({
          slug: "Bad_slug",
          title: { en: "E", ar: "ع" },
          isActive: true,
        });
      assert.equal(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });
  }
);

test(
  "POST /api/courses rejects unknown category",
  { skip: !HAS_DB },
  async () => {
    await runAsAdmin(async ({ app, auth }) => {
      const ts = Date.now();
      const res = await request(app)
        .post("/api/courses")
        .set(auth)
        .send({
          slug: `course-${ts}`,
          category: `no-such-cat-${ts}`,
          ageMin: 8,
          ageMax: 12,
          level: "beginner",
          lessons: 5,
          durationWeeks: 4,
          title: { en: "T", ar: "ع" },
          description: { en: "D", ar: "و" },
          skills: { en: [], ar: [] },
          price: 0,
          currency: "USD",
          discountPercent: 0,
        });
      assert.equal(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });
  }
);

test(
  "POST /api/categories then POST /api/courses succeeds",
  { skip: !HAS_DB },
  async () => {
    await mongoose.connect(MONGODB_URI);
    const app = createApp();
    const admin = await User.create({
      name: "Admin Course Create",
      email: `admin-cc-${Date.now()}@test.local`,
      password: "testpassword123",
      role: "admin",
    });
    const token = jwt.sign(
      { id: admin._id.toString(), role: "admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const auth = { Authorization: `Bearer ${token}` };
    const ts = Date.now();
    const catSlug = `test-cat-${ts}`;
    const courseSlug = `test-course-${ts}`;
    try {
      const catRes = await request(app)
        .post("/api/categories")
        .set(auth)
        .send({
          slug: catSlug,
          title: { en: "Cat EN", ar: "Cat AR" },
          sortOrder: 100,
          isActive: true,
        });
      assert.equal(catRes.status, 201, JSON.stringify(catRes.body));

      const courseRes = await request(app)
        .post("/api/courses")
        .set(auth)
        .send({
          slug: courseSlug,
          category: catSlug,
          ageMin: 8,
          ageMax: 12,
          level: "beginner",
          lessons: 5,
          durationWeeks: 4,
          iconName: "BookOpen",
          color: "from-blue-400 to-cyan-400",
          title: { en: "Course EN", ar: "Course AR" },
          description: { en: "Desc EN", ar: "Desc AR" },
          skills: { en: ["a"], ar: ["ب"] },
          price: 10,
          currency: "USD",
          discountPercent: 0,
        });
      assert.equal(courseRes.status, 201, JSON.stringify(courseRes.body));
      assert.equal(courseRes.body.currency, "USD");
    } finally {
      await Course.deleteOne({ slug: courseSlug });
      await Category.deleteOne({ slug: catSlug });
      await User.deleteOne({ _id: admin._id });
      await mongoose.disconnect();
    }
  }
);

test(
  "POST /api/challenges rejects empty titleEn",
  { skip: !HAS_DB },
  async () => {
    await runAsAdmin(async ({ app, auth }) => {
      const res = await request(app)
        .post("/api/challenges")
        .set(auth)
        .send({
          slug: `ch-${Date.now()}`,
          monthKey: "2026-04",
          titleEn: "   ",
          titleAr: "ع",
        });
      assert.equal(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });
  }
);

test(
  "POST /api/team rejects empty English name",
  { skip: !HAS_DB },
  async () => {
    await runAsAdmin(async ({ app, auth }) => {
      const res = await request(app)
        .post("/api/team")
        .set(auth)
        .send({
          name: { en: "", ar: "ع" },
          role: { en: "Role", ar: "ر" },
          avatar: "PC",
        });
      assert.equal(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });
  }
);

test(
  "POST /api/admin/promos rejects discountValue 0",
  { skip: !HAS_DB },
  async () => {
    await runAsAdmin(async ({ app, auth }) => {
      const res = await request(app)
        .post("/api/admin/promos")
        .set(auth)
        .send({
          code: `Z${Date.now()}`,
          discountType: "percent",
          discountValue: 0,
          currency: "USD",
        });
      assert.equal(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });
  }
);

test(
  "POST /api/admin/users/invite-instructor rejects short optional password",
  { skip: !HAS_DB },
  async () => {
    await runAsAdmin(async ({ app, auth }) => {
      const res = await request(app)
        .post("/api/admin/users/invite-instructor")
        .set(auth)
        .send({
          name: "Instructor",
          email: `inv-${Date.now()}@test.local`,
          password: "short",
        });
      assert.equal(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });
  }
);
