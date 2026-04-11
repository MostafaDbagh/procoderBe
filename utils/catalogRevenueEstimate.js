/**
 * Pure helpers matching Overview “catalog revenue” (enrollment × unit price after course discount).
 * Used for tests and documentation; Mongo aggregations in adminController follow the same rules.
 */

const COMMITTED = new Set(["confirmed", "active", "completed"]);

function unitAfterCourseDiscount(course) {
  const p = Math.max(0, Number(course.price) || 0);
  const d = Math.min(100, Math.max(0, Number(course.discountPercent) || 0));
  return Math.round(p * (1 - d / 100) * 100) / 100;
}

/**
 * @param {{ courseId: string; status: string }[]} enrollments
 * @param {Record<string, { price?: number; currency?: string; discountPercent?: number }>} courseBySlug
 * @returns {Record<string, number>} totals in major units by currency code
 */
function committedRevenueByCurrency(enrollments, courseBySlug) {
  const by = {};
  for (const e of enrollments) {
    if (!e || !COMMITTED.has(e.status)) continue;
    const c = courseBySlug[e.courseId];
    if (!c) continue;
    const cur = String(c.currency || "USD").toUpperCase();
    const amt = unitAfterCourseDiscount(c);
    by[cur] = (by[cur] || 0) + amt;
  }
  return by;
}

/**
 * Per course slug: committed enrollment count and subtotal (n × unit list price).
 * @returns {Record<string, { count: number; unitPrice: number; currency: string; subtotal: number }>}
 */
function committedSubtotalsByCourse(enrollments, courseBySlug) {
  const counts = {};
  for (const e of enrollments) {
    if (!e || !COMMITTED.has(e.status)) continue;
    const id = e.courseId;
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;
  }
  const out = {};
  for (const slug of Object.keys(counts)) {
    const c = courseBySlug[slug] || {};
    const n = counts[slug];
    const unitPrice = unitAfterCourseDiscount(c);
    const currency = String(c.currency || "USD").toUpperCase();
    out[slug] = {
      count: n,
      unitPrice,
      currency,
      subtotal: Math.round(unitPrice * n * 100) / 100,
    };
  }
  return out;
}

module.exports = {
  committedRevenueByCurrency,
  committedSubtotalsByCourse,
};
