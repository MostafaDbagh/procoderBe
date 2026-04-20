/**
 * Parent password reset: request → verify → reset → login (real MongoDB).
 * Skipped when MONGODB_URI / JWT_SECRET unset.
 * Uses a fixed OTP by overwriting codeHash after request (email send is no-op without Resend in dev).
 *
 * Run: `MONGODB_URI=... JWT_SECRET=01234567890123456 npm test`
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { createApp } = require("../createApp");
const User = require("../models/User");
const ParentPasswordResetOtp = require("../models/ParentPasswordResetOtp");

const canRun =
  Boolean(process.env.MONGODB_URI) &&
  String(process.env.JWT_SECRET || "").length >= 16;

const KNOWN_CODE = "7391";

describe("Parent password reset (MongoDB)", { skip: !canRun }, () => {
  const app = createApp();
  let suffix;
  let parentEmail;
  const oldPassword = "OriginalPwd1";
  const newPassword = "RenewedPwd2";

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    suffix = `pr${Date.now()}`;
    parentEmail = `parent-reset-${suffix}@test.local`;

    await User.create({
      name: "Reset Test Parent",
      email: parentEmail,
      password: oldPassword,
      role: "parent",
      phone: "+15550009999",
    });
  });

  after(async () => {
    if (!canRun) return;
    await ParentPasswordResetOtp.deleteMany({ email: parentEmail });
    await User.deleteMany({ email: parentEmail });
    await mongoose.connection.close();
  });

  async function setKnownOtpOnRecord() {
    const codeHash = await bcrypt.hash(KNOWN_CODE, 10);
    const r = await ParentPasswordResetOtp.findOneAndUpdate(
      { email: parentEmail },
      {
        $set: {
          codeHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          attempts: 0,
        },
      },
      { returnDocument: "after" }
    );
    assert.ok(r, "OTP row should exist after request-password-reset");
  }

  test("request-password-reset returns generic success for parent", async () => {
    const res = await request(app)
      .post("/api/auth/parent/request-password-reset")
      .send({ email: parentEmail, locale: "en" });

    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.ok, true);
    assert.ok(String(res.body.message || "").length > 0);

    const row = await ParentPasswordResetOtp.findOne({ email: parentEmail });
    assert.ok(row, "OTP document created");
    assert.ok(row.expiresAt > new Date());
  });

  test("verify-reset-otp: wrong code increments attempts; right code succeeds", async () => {
    await setKnownOtpOnRecord();

    const bad = await request(app)
      .post("/api/auth/parent/verify-reset-otp")
      .send({ email: parentEmail, code: "0000" });
    assert.equal(bad.status, 400, bad.text);

    const rowAfterBad = await ParentPasswordResetOtp.findOne({ email: parentEmail });
    assert.equal(rowAfterBad.attempts, 1);

    const good = await request(app)
      .post("/api/auth/parent/verify-reset-otp")
      .send({ email: parentEmail, code: KNOWN_CODE });
    assert.equal(good.status, 200, good.text);
    assert.equal(good.body.ok, true);
  });

  test("reset-password updates password and removes OTP; login works with new password", async () => {
    await setKnownOtpOnRecord();

    const reset = await request(app)
      .post("/api/auth/parent/reset-password")
      .send({
        email: parentEmail,
        code: KNOWN_CODE,
        password: newPassword,
      });
    assert.equal(reset.status, 200, reset.text);
    assert.equal(reset.body.ok, true);

    const noOtp = await ParentPasswordResetOtp.findOne({ email: parentEmail });
    assert.equal(noOtp, null);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: parentEmail, password: oldPassword });
    assert.equal(oldLogin.status, 400);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: parentEmail, password: newPassword });
    assert.equal(newLogin.status, 200, newLogin.text);
    assert.ok(newLogin.body.token);
    assert.equal(newLogin.body.user?.email, parentEmail);
  });

  test("non-parent email: request succeeds but no OTP row", async () => {
    const instructorEmail = `instructor-reset-${suffix}@test.local`;
    await User.create({
      name: "Instructor Only",
      email: instructorEmail,
      password: "TeachPass1",
      role: "instructor",
    });

    try {
      const res = await request(app)
        .post("/api/auth/parent/request-password-reset")
        .send({ email: instructorEmail, locale: "en" });

      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);

      const row = await ParentPasswordResetOtp.findOne({ email: instructorEmail });
      assert.equal(row, null);
    } finally {
      await User.deleteMany({ email: instructorEmail });
    }
  });

  test("after too many wrong verifies, record is cleared", async () => {
    const email = `lockout-${suffix}@test.local`;
    await User.create({
      name: "Lockout Parent",
      email,
      password: "LockPass1",
      role: "parent",
      phone: "+15550008888",
    });

    try {
      await request(app)
        .post("/api/auth/parent/request-password-reset")
        .send({ email, locale: "en" });

      const codeHash = await bcrypt.hash("1111", 10);
      await ParentPasswordResetOtp.findOneAndUpdate(
        { email },
        { $set: { codeHash, attempts: 0, expiresAt: new Date(Date.now() + 600_000) } }
      );

      for (let i = 0; i < 5; i += 1) {
        const res = await request(app)
          .post("/api/auth/parent/verify-reset-otp")
          .send({ email, code: "9999" });
        assert.equal(res.status, 400, `attempt ${i + 1}`);
      }

      const sixth = await request(app)
        .post("/api/auth/parent/verify-reset-otp")
        .send({ email, code: "9999" });
      assert.equal(sixth.status, 400);
      assert.ok(
        String(sixth.body.message || "").toLowerCase().includes("many") ||
          String(sixth.body.message || "").toLowerCase().includes("code")
      );

      const gone = await ParentPasswordResetOtp.findOne({ email });
      assert.equal(gone, null);
    } finally {
      await ParentPasswordResetOtp.deleteMany({ email });
      await User.deleteMany({ email });
    }
  });
});
