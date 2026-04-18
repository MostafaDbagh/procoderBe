/**
 * End-to-end checks against a real MongoDB (skipped when MONGODB_URI / JWT_SECRET unset).
 * Run: `MONGODB_URI=... JWT_SECRET=01234567890123456 npm test`
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const { createApp } = require("../createApp");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");

const canRun =
  Boolean(process.env.MONGODB_URI) &&
  String(process.env.JWT_SECRET || "").length >= 16;

function enrollmentPayload(email, overrides) {
  return {
    parentName: "Integration Parent",
    email,
    phone: "+15550001111",
    relationship: "mother",
    childName: "Alex",
    childAge: 8,
    gradeLevel: "G3",
    courseId: "scratch",
    sessionFormat: "online",
    agreeTerms: true,
    status: "confirmed",
    ...overrides,
  };
}

describe("Parent signup + multi-child (MongoDB)", { skip: !canRun }, () => {
  const app = createApp();
  let suffix;
  let emailMulti;
  let emailEnrOnly;
  let emailSignupPhoneFlow;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    suffix = `t${Date.now()}`;
    emailMulti = `parent-multi-${suffix}@test.local`;
    emailEnrOnly = `enr-phone-${suffix}@test.local`;
    emailSignupPhoneFlow = `signup-phone-${suffix}@test.local`;
  });

  after(async () => {
    if (!canRun) return;
    await Enrollment.deleteMany({
      email: { $in: [emailMulti, emailEnrOnly] },
    });
    await User.deleteMany({
      email: { $in: [emailMulti, emailSignupPhoneFlow] },
    });
    await mongoose.connection.close();
  });

  test("multi-child check + register links user; phone-only match with different account email", async () => {
    const courseA = `course-a-${suffix}`;
    const courseB = `course-b-${suffix}`;
    const coursePh = `course-ph-${suffix}`;

    await Enrollment.create([
      enrollmentPayload(emailMulti, {
        childName: "Sara",
        courseId: courseA,
        courseTitle: "Course A",
      }),
      enrollmentPayload(emailMulti, {
        childName: "Omar",
        courseId: courseB,
        courseTitle: "Course B",
      }),
    ]);

    const checkMulti = await request(app)
      .post("/api/auth/check-parent-signup")
      .send({
        name: "Integration Parent",
        email: emailMulti,
        phone: "",
      });

    assert.equal(checkMulti.status, 200, checkMulti.text);
    assert.equal(checkMulti.body.eligible, true);
    assert.equal(checkMulti.body.children.length, 2);
    assert.deepEqual(
      checkMulti.body.children.map((c) => c.childName).sort(),
      ["Omar", "Sara"]
    );

    const regMulti = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Integration Parent",
        email: emailMulti,
        password: "SecretPass123",
        phone: "+15550001111",
      });

    assert.equal(regMulti.status, 201, regMulti.text);
    const userMultiId = regMulti.body.user?.id;
    assert.ok(userMultiId);

    const linkedMulti = await Enrollment.find({ email: emailMulti });
    assert.equal(linkedMulti.length, 2);
    assert.ok(linkedMulti.every((e) => String(e.user) === String(userMultiId)));

    await Enrollment.create(
      enrollmentPayload(emailEnrOnly, {
        parentName: "Phone Match Parent",
        phone: "+966501999888",
        courseId: coursePh,
      })
    );

    const checkPhone = await request(app)
      .post("/api/auth/check-parent-signup")
      .send({
        name: "Phone Match Parent",
        email: "",
        phone: "+966 501 999 888",
      });

    assert.equal(checkPhone.status, 200, checkPhone.text);
    assert.equal(checkPhone.body.eligible, true);
    assert.equal(checkPhone.body.children.length, 1);

    const regPhone = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Phone Match Parent",
        email: emailSignupPhoneFlow,
        password: "SecretPass123",
        phone: "+966501999888",
      });

    assert.equal(regPhone.status, 201, regPhone.text);
    const userPhoneId = regPhone.body.user.id;

    const linkedPhone = await Enrollment.find({ user: userPhoneId });
    assert.equal(linkedPhone.length, 1);
    assert.equal(linkedPhone[0].email, emailEnrOnly);
  });
});
