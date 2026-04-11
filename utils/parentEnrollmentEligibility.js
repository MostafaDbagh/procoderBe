const Enrollment = require("../models/Enrollment");

function normalizeEmail(email) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

function normalizeParentName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Digits only — compares enrollment phone to signup phone regardless of spaces/plus. */
function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function childDedupeKey(row) {
  const n = normalizeParentName(row.childName || "");
  const id = String(row.childStudentId || "")
    .trim()
    .toLowerCase();
  return `${n}|||${id}`;
}

const SIGNUP_MATCH_SELECT =
  "parentName email phone childName childAge gradeLevel courseTitle courseId childStudentId status";

/**
 * Pure filter: parent name matches and signup email or phone matches enrollment row.
 * @param {Iterable<object>} mergedRows deduped enrollment lean docs from DB queries
 */
function filterMergedRowsForParentSignup(mergedRows, email, parentName, phone) {
  const e = normalizeEmail(email);
  const target = normalizeParentName(parentName);
  const p = normalizePhone(phone);
  if (!target) return [];
  if (!e && p.length < 8) return [];

  const out = [];
  for (const row of mergedRows) {
    if (normalizeParentName(row.parentName) !== target) continue;
    const rowE = normalizeEmail(row.email);
    const rowP = normalizePhone(row.phone);
    const emailOk = Boolean(e) && rowE === e;
    const phoneOk = p.length >= 8 && rowP === p;
    if (emailOk || phoneOk) out.push(row);
  }
  return out;
}

/**
 * Non-cancelled enrollments where parent/guardian name matches and either email or phone matches.
 * @returns {Promise<object[]>} lean enrollment docs
 */
async function findMatchingEnrollmentsForParentSignup(email, parentName, phone) {
  const e = normalizeEmail(email);
  const target = normalizeParentName(parentName);
  const p = normalizePhone(phone);
  if (!target) return [];
  if (!e && p.length < 8) return [];

  const byId = new Map();

  if (e) {
    const rows = await Enrollment.find({
      email: e,
      status: { $ne: "cancelled" },
    })
      .select(SIGNUP_MATCH_SELECT)
      .lean();
    for (const row of rows) byId.set(String(row._id), row);
  }

  if (p.length >= 8) {
    const rows = await Enrollment.find({
      status: { $ne: "cancelled" },
      phone: { $nin: [null, ""] },
    })
      .select(SIGNUP_MATCH_SELECT)
      .lean();
    for (const row of rows) {
      if (normalizePhone(row.phone) === p) {
        byId.set(String(row._id), row);
      }
    }
  }

  return filterMergedRowsForParentSignup(byId.values(), email, parentName, phone);
}

async function hasMatchingEnrollmentForParentSignup(email, parentName, phone) {
  const rows = await findMatchingEnrollmentsForParentSignup(
    email,
    parentName,
    phone
  );
  return rows.length > 0;
}

/**
 * One row per distinct child (name + optional student id), with how many enrollments they have.
 */
function summarizeChildrenForSignupResponse(enrollmentRows) {
  const byKey = new Map();
  for (const row of enrollmentRows) {
    const key = childDedupeKey(row);
    if (!byKey.has(key)) {
      byKey.set(key, {
        childName: String(row.childName || "").trim() || "Student",
        childAge: row.childAge,
        gradeLevel: row.gradeLevel ? String(row.gradeLevel).trim() : "",
        enrollmentCount: 0,
      });
    }
    const agg = byKey.get(key);
    agg.enrollmentCount += 1;
  }
  return [...byKey.values()].sort((a, b) =>
    a.childName.localeCompare(b.childName, undefined, {
      sensitivity: "base",
    })
  );
}

module.exports = {
  normalizeEmail,
  normalizeParentName,
  normalizePhone,
  filterMergedRowsForParentSignup,
  findMatchingEnrollmentsForParentSignup,
  hasMatchingEnrollmentForParentSignup,
  summarizeChildrenForSignupResponse,
};
