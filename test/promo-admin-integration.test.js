const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { createApp } = require("../createApp");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const HAS_DB = Boolean(
  MONGODB_URI && JWT_SECRET && String(JWT_SECRET).length >= 16
);

test("GET /api/admin/promos without token returns 401", async () => {
  const app = createApp();
  const res = await request(app).get("/api/admin/promos");
  assert.equal(res.status, 401);
});

test("POST /api/promos/quote with missing courseId returns 400", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/api/promos/quote")
    .set("Content-Type", "application/json")
    .send({});
  assert.equal(res.status, 400);
});

test("admin promo CRUD with live MongoDB", { skip: !HAS_DB }, async () => {
  await mongoose.connect(MONGODB_URI);
  const app = createApp();

  const admin = await User.create({
    name: "Promo CRUD Test Admin",
    email: `promo-crud-${Date.now()}@test.local`,
    password: "testpassword123",
    role: "admin",
  });

  const token = jwt.sign(
    { id: admin._id.toString(), role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  const auth = { Authorization: `Bearer ${token}` };

  const code = `TCRUD${Date.now()}`;
  try {
    const createRes = await request(app)
      .post("/api/admin/promos")
      .set(auth)
      .send({
        code,
        discountType: "percent",
        discountValue: 15,
        currency: "USD",
        isActive: true,
        description: "integration test",
        courseSlugs: [],
      });

    assert.equal(
      createRes.status,
      201,
      JSON.stringify(createRes.body)
    );
    const id = createRes.body._id;
    assert.ok(id);

    const getRes = await request(app)
      .get(`/api/admin/promos/${id}`)
      .set(auth);
    assert.equal(getRes.status, 200);
    assert.equal(String(getRes.body.code), code);
    assert.equal(getRes.body.discountValue, 15);

    const patchRes = await request(app)
      .patch(`/api/admin/promos/${id}`)
      .set(auth)
      .send({ discountValue: 20, description: "patched" });
    assert.equal(patchRes.status, 200, JSON.stringify(patchRes.body));
    assert.equal(patchRes.body.discountValue, 20);
    assert.equal(patchRes.body.description, "patched");

    const listRes = await request(app).get("/api/admin/promos?q=" + code).set(auth);
    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.items));
    assert.ok(listRes.body.items.some((r) => String(r._id) === String(id)));

    const delRes = await request(app)
      .delete(`/api/admin/promos/${id}`)
      .set(auth);
    assert.equal(delRes.status, 200);
  } finally {
    await User.deleteOne({ _id: admin._id });
    await mongoose.disconnect();
  }
});
