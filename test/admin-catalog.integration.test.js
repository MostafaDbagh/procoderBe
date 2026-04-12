/**
 * Admin category & course API against real MongoDB.
 * Run: `npm test` (uses .env MONGODB_URI + JWT_SECRET when set).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { createApp } = require("../createApp");
const User = require("../models/User");
const Category = require("../models/Category");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const canRun =
  Boolean(process.env.MONGODB_URI) &&
  String(process.env.JWT_SECRET || "").length >= 16;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe("Admin catalog API (MongoDB)", { skip: !canRun }, () => {
  const app = createApp();
  let suffix;
  let adminToken;
  let parentToken;
  let adminUser;
  let parentUser;
  const catSlug = () => `intcat-${suffix}`;
  const catBlockSlug = () => `intcatblk-${suffix}`;
  const courseSlug = () => `intcrs-${suffix}`;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    suffix = `t${Date.now()}`;

    adminUser = await User.create({
      name: "Integration Admin Catalog",
      email: `int-adm-cat-${suffix}@test.local`,
      username: `intadmcat${suffix}`,
      password: "IntTestAdm1!",
      role: "admin",
    });
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    parentUser = await User.create({
      name: "Integration Parent Catalog",
      email: `int-par-cat-${suffix}@test.local`,
      password: "IntTestPar1!",
      role: "parent",
    });
    parentToken = jwt.sign(
      { id: parentUser._id.toString(), role: "parent" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
  });

  after(async () => {
    if (!canRun) return;
    const crs = courseSlug();
    await Enrollment.deleteMany({
      courseId: { $in: [crs, `${crs}-blk`] },
    });
    await Course.deleteMany({
      slug: { $in: [crs, `${crs}-blk`] },
    });
    await Category.deleteMany({
      slug: { $in: [catSlug(), catBlockSlug()] },
    });
    await User.deleteMany({
      _id: { $in: [adminUser._id, parentUser._id] },
    });
    await mongoose.connection.close();
  });

  test("GET /api/categories/admin/list — 403 for non-admin", async () => {
    const res = await request(app)
      .get("/api/categories/admin/list?page=1&limit=10")
      .set(authHeader(parentToken));
    assert.equal(res.status, 403);
  });

  test("GET /api/categories/admin/list — 200 paged shape", async () => {
    const res = await request(app)
      .get("/api/categories/admin/list?page=1&limit=10")
      .set(authHeader(adminToken));
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.items));
    assert.ok(typeof res.body.total === "number");
    assert.ok(typeof res.body.page === "number");
    assert.ok(typeof res.body.limit === "number");
    assert.ok(typeof res.body.totalPages === "number");
  });

  test("category CRUD: create → by-slug → put → delete (hard)", async () => {
    const slug = catSlug();
    let res = await request(app)
      .post("/api/categories")
      .set(authHeader(adminToken))
      .send({
        slug,
        title: { en: "Int Cat EN", ar: "Int Cat AR" },
        description: { en: "Desc EN", ar: "Desc AR" },
        sortOrder: 999,
        isActive: true,
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));

    res = await request(app)
      .get(`/api/categories/admin/by-slug/${encodeURIComponent(slug)}`)
      .set(authHeader(adminToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.title.en, "Int Cat EN");

    res = await request(app)
      .put(`/api/categories/${encodeURIComponent(slug)}`)
      .set(authHeader(adminToken))
      .send({
        title: { en: "Updated EN", ar: "Updated AR" },
        description: { en: "D2", ar: "د2" },
        sortOrder: 998,
        isActive: true,
      });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.title.en, "Updated EN");

    res = await request(app)
      .delete(`/api/categories/${encodeURIComponent(slug)}`)
      .set(authHeader(adminToken));
    assert.equal(res.status, 200);
    assert.match(res.body.message || "", /deleted/i);

    const gone = await Category.findOne({ slug }).lean();
    assert.equal(gone, null);
  });

  test("course roundtrip + deactivate + permanent delete", async () => {
    const cSlug = catSlug();
    const crs = courseSlug();

    let res = await request(app)
      .post("/api/categories")
      .set(authHeader(adminToken))
      .send({
        slug: cSlug,
        title: { en: "For Course", ar: "للدورة" },
        sortOrder: 997,
        isActive: true,
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));

    res = await request(app)
      .post("/api/courses")
      .set(authHeader(adminToken))
      .send({
        slug: crs,
        category: cSlug,
        ageMin: 8,
        ageMax: 12,
        level: "beginner",
        lessons: 10,
        durationWeeks: 8,
        title: { en: "Int Course", ar: "دورة" },
        description: { en: "English desc", ar: "وصف" },
        skills: { en: ["a"], ar: ["ب"] },
        price: 100,
        discountPercent: 0,
      });
    assert.equal(res.status, 201, JSON.stringify(res.body));

    res = await request(app)
      .get("/api/courses/admin/list?page=1&limit=200")
      .set(authHeader(adminToken));
    assert.equal(res.status, 200);
    const found = res.body.items.find((x) => x.slug === crs);
    assert.ok(found, "course appears in admin list");

    res = await request(app)
      .put(`/api/courses/${encodeURIComponent(crs)}`)
      .set(authHeader(adminToken))
      .send({
        title: { en: "Int Course 2", ar: "دورة2" },
        description: { en: "English desc", ar: "وصف" },
        category: cSlug,
        ageMin: 8,
        ageMax: 12,
        level: "beginner",
        lessons: 10,
        durationWeeks: 8,
        skills: { en: ["a"], ar: ["ب"] },
        price: 120,
      });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.title.en, "Int Course 2");

    res = await request(app)
      .delete(`/api/courses/${encodeURIComponent(crs)}`)
      .set(authHeader(adminToken));
    assert.equal(res.status, 200);

    res = await request(app)
      .delete(`/api/courses/${encodeURIComponent(crs)}/permanent`)
      .set(authHeader(adminToken));
    assert.equal(res.status, 200, JSON.stringify(res.body));

    const gone = await Course.findOne({ slug: crs }).lean();
    assert.equal(gone, null);

    res = await request(app)
      .delete(`/api/categories/${encodeURIComponent(cSlug)}`)
      .set(authHeader(adminToken));
    assert.equal(res.status, 200);
  });

  test("DELETE category deactivates when a course still references slug", async () => {
    const blk = catBlockSlug();
    const crs = `${courseSlug()}-blk`;

    let res = await request(app)
      .post("/api/categories")
      .set(authHeader(adminToken))
      .send({
        slug: blk,
        title: { en: "Block", ar: "بلوك" },
        sortOrder: 996,
        isActive: true,
      });
    assert.equal(res.status, 201);

    res = await request(app)
      .post("/api/courses")
      .set(authHeader(adminToken))
      .send({
        slug: crs,
        category: blk,
        ageMin: 8,
        ageMax: 12,
        level: "beginner",
        lessons: 5,
        durationWeeks: 4,
        title: { en: "C", ar: "ج" },
        description: { en: "e", ar: "ع" },
        skills: { en: [], ar: [] },
        price: 50,
      });
    assert.equal(res.status, 201);

    res = await request(app)
      .delete(`/api/categories/${encodeURIComponent(blk)}`)
      .set(authHeader(adminToken));
    assert.equal(res.status, 200);
    assert.match(res.body.message || "", /deactivat/i);

    const row = await Category.findOne({ slug: blk }).lean();
    assert.ok(row);
    assert.equal(row.isActive, false);

    await request(app)
      .delete(`/api/courses/${encodeURIComponent(crs)}/permanent`)
      .set(authHeader(adminToken));
    await request(app)
      .delete(`/api/categories/${encodeURIComponent(blk)}`)
      .set(authHeader(adminToken));
    const after = await Category.findOne({ slug: blk }).lean();
    assert.equal(after, null);
  });

  test("validation errors return errors array (category create)", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set(authHeader(adminToken))
      .send({
        slug: "BAD SLUG SPACE",
        title: { en: "x", ar: "y" },
      });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length > 0);
  });
});
