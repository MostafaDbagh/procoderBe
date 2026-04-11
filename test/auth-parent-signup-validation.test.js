const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../createApp");

describe("POST /api/auth/check-parent-signup — validation (no database)", () => {
  const app = createApp();

  test("400 when name missing", async () => {
    const res = await request(app)
      .post("/api/auth/check-parent-signup")
      .send({ name: "", email: "a@b.com", phone: "" });
    assert.equal(res.status, 400);
  });

  test("400 when neither valid email nor 8+ digit phone", async () => {
    const res = await request(app)
      .post("/api/auth/check-parent-signup")
      .send({ name: "Parent Name", email: "", phone: "12345" });
    assert.equal(res.status, 400);
  });

  test("400 when email present but invalid format", async () => {
    const res = await request(app)
      .post("/api/auth/check-parent-signup")
      .send({ name: "Parent Name", email: "not-an-email", phone: "" });
    assert.equal(res.status, 400);
  });
});

describe("POST /api/auth/register — validation (no database)", () => {
  const app = createApp();

  test("400 when password too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Parent",
        email: "p@example.com",
        password: "12345",
        phone: "+966501234567",
      });
    assert.equal(res.status, 400);
  });
});
