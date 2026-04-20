const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../createApp");

describe("POST /api/auth/parent/request-password-reset — validation (no database)", () => {
  const app = createApp();

  test("400 when email invalid", async () => {
    const res = await request(app)
      .post("/api/auth/parent/request-password-reset")
      .send({ email: "not-email", locale: "en" });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors) || res.body.message);
  });
});

describe("POST /api/auth/parent/verify-reset-otp — validation (no database)", () => {
  const app = createApp();

  test("400 when email invalid", async () => {
    const res = await request(app)
      .post("/api/auth/parent/verify-reset-otp")
      .send({ email: "bad", code: "1234" });
    assert.equal(res.status, 400);
  });

  test("400 when code not 4 digits", async () => {
    const res = await request(app)
      .post("/api/auth/parent/verify-reset-otp")
      .send({ email: "ok@test.local", code: "12" });
    assert.equal(res.status, 400);
  });

  test("400 when code sanitized to wrong length", async () => {
    const res = await request(app)
      .post("/api/auth/parent/verify-reset-otp")
      .send({ email: "ok@test.local", code: "12345" });
    assert.equal(res.status, 400);
  });
});

describe("POST /api/auth/parent/reset-password — validation (no database)", () => {
  const app = createApp();

  test("400 when password too weak", async () => {
    const res = await request(app)
      .post("/api/auth/parent/reset-password")
      .send({
        email: "p@test.local",
        code: "1234",
        password: "short",
      });
    assert.equal(res.status, 400);
  });

  test("400 when code not 4 digits", async () => {
    const res = await request(app)
      .post("/api/auth/parent/reset-password")
      .send({
        email: "p@test.local",
        code: "123456",
        password: "GoodPass123",
      });
    assert.equal(res.status, 400);
  });
});
