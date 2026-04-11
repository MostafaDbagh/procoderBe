const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const eligibilityPath = path.join(__dirname, "../utils/parentEnrollmentEligibility.js");
const enrollmentPath = path.join(__dirname, "../models/Enrollment.js");

/**
 * Load parentEnrollmentEligibility with a stubbed Enrollment model (no MongoDB).
 */
function withStubbedEnrollment(stubFind, fn) {
  const savedEnroll = require.cache[enrollmentPath];
  const savedElig = require.cache[eligibilityPath];
  delete require.cache[eligibilityPath];
  require.cache[enrollmentPath] = {
    id: enrollmentPath,
    filename: enrollmentPath,
    loaded: true,
    exports: { find: stubFind },
  };
  try {
    const mod = require(eligibilityPath);
    return fn(mod);
  } finally {
    if (savedEnroll) require.cache[enrollmentPath] = savedEnroll;
    else delete require.cache[enrollmentPath];
    if (savedElig) require.cache[eligibilityPath] = savedElig;
    else delete require.cache[eligibilityPath];
  }
}

function chainLean(rows) {
  return {
    select() {
      return this;
    },
    lean: async () => rows,
  };
}

const baseRow = (overrides) => ({
  _id: "507f1f77bcf86cd799439011",
  parentName: "Fatima Al-Mansour",
  email: "fatima@example.com",
  phone: "+966 501 234 567",
  childName: "Sara",
  childAge: 9,
  gradeLevel: "G4",
  courseTitle: "Scratch",
  courseId: "scratch",
  childStudentId: "",
  status: "confirmed",
  ...overrides,
});

describe("parentEnrollmentEligibility — normalizers", () => {
  const {
    normalizeEmail,
    normalizeParentName,
    normalizePhone,
  } = require("../utils/parentEnrollmentEligibility");

  test("normalizeEmail lowercases and trims", () => {
    assert.equal(normalizeEmail("  Hello@MAIL.COM "), "hello@mail.com");
  });

  test("normalizeParentName collapses whitespace and lowercases", () => {
    assert.equal(normalizeParentName("  Fatima   Al-Mansour "), "fatima al-mansour");
  });

  test("normalizePhone strips non-digits", () => {
    assert.equal(normalizePhone("+966 (50) 123-4567"), "966501234567");
  });
});

describe("parentEnrollmentEligibility — filterMergedRowsForParentSignup", () => {
  const { filterMergedRowsForParentSignup } = require("../utils/parentEnrollmentEligibility");

  test("returns [] when parent name empty after normalize", () => {
    const rows = [baseRow({ parentName: "   " })];
    assert.deepEqual(filterMergedRowsForParentSignup(rows, "a@b.com", "x", ""), []);
  });

  test("returns [] when no email and phone shorter than 8 digits", () => {
    const rows = [baseRow()];
    assert.deepEqual(
      filterMergedRowsForParentSignup(rows, "", "Fatima Al-Mansour", "+96650"),
      []
    );
  });

  test("matches by email and parent name", () => {
    const rows = [
      baseRow({ _id: "1" }),
      baseRow({
        _id: "2",
        parentName: "Other Parent",
        email: "fatima@example.com",
      }),
    ];
    const out = filterMergedRowsForParentSignup(
      rows,
      "fatima@example.com",
      "Fatima Al-Mansour",
      ""
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]._id, "1");
  });

  test("matches by phone (format-insensitive) when parent name matches", () => {
    const rows = [
      baseRow({
        _id: "1",
        email: "other@example.com",
        phone: "+966 501 234 567",
      }),
    ];
    const out = filterMergedRowsForParentSignup(
      rows,
      "",
      "Fatima Al-Mansour",
      "966501234567"
    );
    assert.equal(out.length, 1);
  });

  test("matches when both email and phone provided (OR on row)", () => {
    const rows = [
      baseRow({
        _id: "1",
        email: "fatima@example.com",
        phone: "+1 999",
      }),
    ];
    const byEmail = filterMergedRowsForParentSignup(
      rows,
      "fatima@example.com",
      "Fatima Al-Mansour",
      "966501234567"
    );
    assert.equal(byEmail.length, 1);
  });

  test("rejects wrong parent name even if email matches", () => {
    const rows = [baseRow({ parentName: "Someone Else" })];
    const out = filterMergedRowsForParentSignup(
      rows,
      "fatima@example.com",
      "Fatima Al-Mansour",
      ""
    );
    assert.equal(out.length, 0);
  });

  test("rejects email match when parent differs", () => {
    const rows = [baseRow({ parentName: "Wrong", email: "fatima@example.com" })];
    assert.equal(
      filterMergedRowsForParentSignup(
        rows,
        "fatima@example.com",
        "Fatima Al-Mansour",
        ""
      ).length,
      0
    );
  });
});

describe("parentEnrollmentEligibility — summarizeChildrenForSignupResponse", () => {
  const { summarizeChildrenForSignupResponse } = require("../utils/parentEnrollmentEligibility");

  test("aggregates two courses for one child", () => {
    const rows = [
      baseRow({ _id: "1", childName: "Sara", courseId: "a" }),
      baseRow({ _id: "2", childName: "Sara", courseId: "b" }),
    ];
    const s = summarizeChildrenForSignupResponse(rows);
    assert.equal(s.length, 1);
    assert.equal(s[0].childName, "Sara");
    assert.equal(s[0].enrollmentCount, 2);
  });

  test("keeps two children separate (different names)", () => {
    const rows = [
      baseRow({ _id: "1", childName: "Sara" }),
      baseRow({ _id: "2", childName: "Omar" }),
    ];
    const s = summarizeChildrenForSignupResponse(rows);
    assert.equal(s.length, 2);
    assert.deepEqual(
      s.map((x) => x.childName).sort(),
      ["Omar", "Sara"]
    );
  });

  test("same display name but different childStudentId are two children", () => {
    const rows = [
      baseRow({ _id: "1", childName: "Ali", childStudentId: "A1" }),
      baseRow({ _id: "2", childName: "Ali", childStudentId: "B2" }),
    ];
    const s = summarizeChildrenForSignupResponse(rows);
    assert.equal(s.length, 2);
    assert.equal(s[0].enrollmentCount, 1);
    assert.equal(s[1].enrollmentCount, 1);
  });
});

describe("parentEnrollmentEligibility — findMatchingEnrollmentsForParentSignup (stubbed DB)", () => {
  test("returns early without calling find when name missing", async () => {
    let calls = 0;
    const stubFind = () => {
      calls++;
      return chainLean([]);
    };
    await withStubbedEnrollment(stubFind, async ({ findMatchingEnrollmentsForParentSignup }) => {
      const out = await findMatchingEnrollmentsForParentSignup(
        "a@b.com",
        "  ",
        "+966501234567"
      );
      assert.deepEqual(out, []);
      assert.equal(calls, 0);
    });
  });

  test("email query only when phone digits < 8", async () => {
    const queries = [];
    const stubFind = (q) => {
      queries.push(JSON.parse(JSON.stringify(q)));
      if (q.email) return chainLean([baseRow({ _id: "e1" })]);
      return chainLean([]);
    };
    await withStubbedEnrollment(stubFind, async ({ findMatchingEnrollmentsForParentSignup }) => {
      const out = await findMatchingEnrollmentsForParentSignup(
        "fatima@example.com",
        "Fatima Al-Mansour",
        "123"
      );
      assert.equal(out.length, 1);
      assert.equal(queries.length, 1);
      assert.equal(queries[0].email, "fatima@example.com");
      assert.equal(queries[0].status.$ne, "cancelled");
    });
  });

  test("merges email + phone query and dedupes by _id", async () => {
    const row = baseRow({ _id: "same" });
    let emailCalls = 0;
    const stubFind = (q) => {
      if (q.email) {
        emailCalls++;
        return chainLean([row]);
      }
      return chainLean([row]);
    };
    await withStubbedEnrollment(stubFind, async ({ findMatchingEnrollmentsForParentSignup }) => {
      const out = await findMatchingEnrollmentsForParentSignup(
        "fatima@example.com",
        "Fatima Al-Mansour",
        "+966 501 234 567"
      );
      assert.equal(out.length, 1);
      assert.equal(out[0]._id, "same");
      assert.equal(emailCalls, 1);
    });
  });

  test("phone branch loads candidates and keeps only digit-equal phone", async () => {
    const queries = [];
    const stubFind = (q) => {
      queries.push(q);
      if (q.email) return chainLean([]);
      return chainLean([
        baseRow({
          _id: "p1",
          email: "x@y.com",
          phone: "+966 501 234 567",
        }),
        baseRow({
          _id: "p2",
          email: "x@y.com",
          phone: "+1 555 000 1111",
          parentName: "Fatima Al-Mansour",
        }),
      ]);
    };
    await withStubbedEnrollment(stubFind, async ({ findMatchingEnrollmentsForParentSignup }) => {
      const out = await findMatchingEnrollmentsForParentSignup(
        "",
        "Fatima Al-Mansour",
        "966501234567"
      );
      assert.equal(out.length, 1);
      assert.equal(out[0]._id, "p1");
    });
  });
});
