/**
 * Admin enrollment delete — destructive endpoint, must be airtight.
 * Covers: authz, cascade cleanup, isolation of unrelated rows, revenue refresh.
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
const Course = require("../models/Course");
const Category = require("../models/Category");
const Enrollment = require("../models/Enrollment");
const Payment = require("../models/Payment");
const Note = require("../models/Note");
const Homework = require("../models/Homework");
const Referral = require("../models/Referral");

const canRun =
  Boolean(process.env.MONGODB_URI) &&
  String(process.env.JWT_SECRET || "").length >= 16;

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("DELETE /api/admin/enrollments/:id (MongoDB)", { skip: !canRun }, () => {
  const app = createApp();
  let suffix;
  let adminUser, adminToken;
  let parentUser, parentToken;
  let instructor;
  let category;
  let course;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    suffix = `enrdel${Date.now()}`;

    adminUser = await User.create({
      name: "Int Admin EnrDel",
      email: `int-adm-enrdel-${suffix}@test.local`,
      username: `intadmenrdel${suffix}`,
      password: "IntTestAdm1!",
      role: "admin",
    });
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    parentUser = await User.create({
      name: "Int Parent EnrDel",
      email: `int-par-enrdel-${suffix}@test.local`,
      password: "IntTestPar1!",
      role: "parent",
    });
    parentToken = jwt.sign(
      { id: parentUser._id.toString(), role: "parent" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    instructor = await User.create({
      name: "Int Instructor EnrDel",
      email: `int-ins-enrdel-${suffix}@test.local`,
      password: "IntTestIns1!",
      role: "instructor",
    });

    category = await Category.create({
      slug: `cat-${suffix}`,
      title: { en: "Cat EN", ar: "Cat AR" },
      sortOrder: 900,
      isActive: true,
    });

    course = await Course.create({
      slug: `crs-${suffix}`,
      category: category.slug,
      ageMin: 8,
      ageMax: 12,
      level: "beginner",
      lessons: 10,
      durationWeeks: 8,
      title: { en: "Course EN", ar: "Course AR" },
      description: { en: "desc", ar: "desc" },
      skills: { en: ["a"], ar: ["ب"] },
      price: 200,
      discountPercent: 0,
      currency: "USD",
      isActive: true,
    });
  });

  after(async () => {
    if (!canRun) return;
    // Scope sweep to this test's course/instructor/users so we never touch unrelated rows.
    const leftoverEnrollments = await Enrollment.find({
      courseId: course?.slug,
    })
      .select("_id")
      .lean();
    const leftoverIds = leftoverEnrollments.map((e) => e._id);
    await Promise.all([
      Payment.deleteMany({ enrollment: { $in: leftoverIds } }),
      Note.deleteMany({ courseId: course?.slug }),
      Homework.deleteMany({ courseId: course?.slug }),
      Referral.deleteMany({ code: { $regex: suffix.toUpperCase() } }),
    ]);
    await Enrollment.deleteMany({ courseId: course?.slug });
    await Course.deleteOne({ slug: course?.slug });
    await Category.deleteOne({ slug: category?.slug });
    await User.deleteMany({
      _id: { $in: [adminUser._id, parentUser._id, instructor._id] },
    });
    await mongoose.connection.close();
  });

  // Build a target enrollment + a control enrollment, each with payment/note/homework
  // and a referral entry pointing at them. Returns ids for assertions.
  async function buildFixture() {
    const target = await Enrollment.create({
      parentName: "Target Parent",
      email: `target-${suffix}@test.local`,
      phone: "+10000000001",
      relationship: "father",
      childName: "Target Child",
      childAge: 9,
      gradeLevel: "4",
      courseId: course.slug,
      sessionFormat: "online",
      agreeTerms: true,
      status: "confirmed",
      paymentStatus: "paid",
      currency: "USD",
      amountDue: 200,
    });
    const control = await Enrollment.create({
      parentName: "Control Parent",
      email: `control-${suffix}@test.local`,
      phone: "+10000000002",
      relationship: "mother",
      childName: "Control Child",
      childAge: 10,
      gradeLevel: "5",
      courseId: course.slug,
      sessionFormat: "online",
      agreeTerms: true,
      status: "confirmed",
      paymentStatus: "paid",
      currency: "USD",
      amountDue: 150,
    });

    const targetPayment = await Payment.create({
      enrollment: target._id,
      amountCents: 20000,
      currency: "USD",
      status: "succeeded",
      paymentMethod: "bank_transfer",
    });
    const controlPayment = await Payment.create({
      enrollment: control._id,
      amountCents: 15000,
      currency: "USD",
      status: "succeeded",
      paymentMethod: "bank_transfer",
    });

    const targetNote = await Note.create({
      instructor: instructor._id,
      instructorName: instructor.name,
      enrollment: target._id,
      courseId: course.slug,
      childName: "Target Child",
      parentEmail: target.email,
      type: "general",
      title: "T-note",
      body: "body",
    });
    const controlNote = await Note.create({
      instructor: instructor._id,
      instructorName: instructor.name,
      enrollment: control._id,
      courseId: course.slug,
      childName: "Control Child",
      parentEmail: control.email,
      type: "general",
      title: "C-note",
      body: "body",
    });

    const targetHw = await Homework.create({
      instructor: instructor._id,
      instructorName: instructor.name,
      enrollment: target._id,
      courseId: course.slug,
      childName: "Target Child",
      parentEmail: target.email,
      title: "T-hw",
    });
    const controlHw = await Homework.create({
      instructor: instructor._id,
      instructorName: instructor.name,
      enrollment: control._id,
      courseId: course.slug,
      childName: "Control Child",
      parentEmail: control.email,
      title: "C-hw",
    });

    const referral = await Referral.create({
      referrer: parentUser._id,
      referrerEmail: `ref-${suffix}@test.local`,
      referrerName: "Ref Parent",
      code: `REF${suffix.toUpperCase()}`,
      referrals: [
        { name: "T", email: target.email, enrollmentId: target._id, courseId: course.slug },
        { name: "C", email: control.email, enrollmentId: control._id, courseId: course.slug },
      ],
    });

    return {
      target,
      control,
      targetPayment,
      controlPayment,
      targetNote,
      controlNote,
      targetHw,
      controlHw,
      referral,
    };
  }

  test("401 when unauthenticated", async () => {
    const f = await buildFixture();
    const res = await request(app).delete(`/api/admin/enrollments/${f.target._id}`);
    assert.equal(res.status, 401);
    // Nothing got deleted
    assert.ok(await Enrollment.findById(f.target._id));
    assert.ok(await Payment.findById(f.targetPayment._id));
    await Enrollment.deleteMany({ _id: { $in: [f.target._id, f.control._id] } });
    await Payment.deleteMany({ enrollment: { $in: [f.target._id, f.control._id] } });
    await Note.deleteMany({ enrollment: { $in: [f.target._id, f.control._id] } });
    await Homework.deleteMany({ enrollment: { $in: [f.target._id, f.control._id] } });
    await Referral.deleteOne({ _id: f.referral._id });
  });

  test("403 when caller is not admin", async () => {
    const f = await buildFixture();
    const res = await request(app)
      .delete(`/api/admin/enrollments/${f.target._id}`)
      .set(auth(parentToken));
    assert.equal(res.status, 403);
    assert.ok(await Enrollment.findById(f.target._id), "enrollment must still exist");
    assert.ok(await Payment.findById(f.targetPayment._id), "payment must still exist");
    await Enrollment.deleteMany({ _id: { $in: [f.target._id, f.control._id] } });
    await Payment.deleteMany({ enrollment: { $in: [f.target._id, f.control._id] } });
    await Note.deleteMany({ enrollment: { $in: [f.target._id, f.control._id] } });
    await Homework.deleteMany({ enrollment: { $in: [f.target._id, f.control._id] } });
    await Referral.deleteOne({ _id: f.referral._id });
  });

  test("400 on invalid mongo id", async () => {
    const res = await request(app)
      .delete("/api/admin/enrollments/not-a-mongo-id")
      .set(auth(adminToken));
    assert.equal(res.status, 400);
  });

  test("404 when enrollment not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/admin/enrollments/${fakeId}`)
      .set(auth(adminToken));
    assert.equal(res.status, 404);
  });

  test("happy path: cascade-deletes target + payments/notes/homework/referral entry, leaves control row untouched", async () => {
    const f = await buildFixture();

    const res = await request(app)
      .delete(`/api/admin/enrollments/${f.target._id}`)
      .set(auth(adminToken));
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.ok, true);

    // Target gone
    assert.equal(await Enrollment.findById(f.target._id), null);
    assert.equal(await Payment.findById(f.targetPayment._id), null);
    assert.equal(await Note.findById(f.targetNote._id), null);
    assert.equal(await Homework.findById(f.targetHw._id), null);

    // Referral entry pulled, but referral document itself preserved
    const refDoc = await Referral.findById(f.referral._id).lean();
    assert.ok(refDoc, "referral document still exists");
    assert.equal(refDoc.referrals.length, 1, "only control referral entry remains");
    assert.equal(
      String(refDoc.referrals[0].enrollmentId),
      String(f.control._id)
    );

    // Control siblings untouched
    assert.ok(await Enrollment.findById(f.control._id), "control enrollment kept");
    assert.ok(await Payment.findById(f.controlPayment._id), "control payment kept");
    assert.ok(await Note.findById(f.controlNote._id), "control note kept");
    assert.ok(await Homework.findById(f.controlHw._id), "control homework kept");

    // Cleanup remaining test rows
    await Enrollment.deleteOne({ _id: f.control._id });
    await Payment.deleteOne({ _id: f.controlPayment._id });
    await Note.deleteOne({ _id: f.controlNote._id });
    await Homework.deleteOne({ _id: f.controlHw._id });
    await Referral.deleteOne({ _id: f.referral._id });
  });

  test("revenue overview reflects deletion (committed total + payment count drop)", async () => {
    const f = await buildFixture();

    // Snapshot before
    const before = await request(app)
      .get("/api/admin/overview")
      .set(auth(adminToken));
    assert.equal(before.status, 200);
    const beforeCommitted =
      Number(before.body.revenue.committed.byCurrency.USD) || 0;
    const beforePayCount =
      Number(before.body.payments.succeeded.paymentCount) || 0;

    // Delete target ($200 enrollment + $200 succeeded payment)
    const del = await request(app)
      .delete(`/api/admin/enrollments/${f.target._id}`)
      .set(auth(adminToken));
    assert.equal(del.status, 200);

    const after = await request(app)
      .get("/api/admin/overview")
      .set(auth(adminToken));
    assert.equal(after.status, 200);
    const afterCommitted =
      Number(after.body.revenue.committed.byCurrency.USD) || 0;
    const afterPayCount =
      Number(after.body.payments.succeeded.paymentCount) || 0;

    // Enrollment-side revenue dropped by ≥ 200 (the deleted row's amountDue).
    // Use ≥ because other tests/data in the same DB shouldn't matter — the diff is what we control.
    assert.ok(
      beforeCommitted - afterCommitted >= 200 - 0.01,
      `committed should drop by ≥200; before=${beforeCommitted} after=${afterCommitted}`
    );
    // Payment-side count dropped by ≥ 1 (the deleted enrollment's succeeded payment).
    assert.ok(
      beforePayCount - afterPayCount >= 1,
      `succeeded payment count should drop by ≥1; before=${beforePayCount} after=${afterPayCount}`
    );

    // Cleanup
    await Enrollment.deleteOne({ _id: f.control._id });
    await Payment.deleteOne({ _id: f.controlPayment._id });
    await Note.deleteOne({ _id: f.controlNote._id });
    await Homework.deleteOne({ _id: f.controlHw._id });
    await Referral.deleteOne({ _id: f.referral._id });
  });
});
