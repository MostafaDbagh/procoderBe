const PromoCode = require("../models/PromoCode");
const { applyPromo } = require("../utils/pricing");

/**
 * @param {string} codeRaw
 * @param {{ slug: string; currency?: string }} course - lean course
 * @returns {Promise<{ doc?: object; error?: string; afterPromo?: number; promoSaved?: number }>}
 */
async function validatePromoForCourse(codeRaw, course) {
  const code = String(codeRaw || "")
    .trim()
    .toUpperCase();
  if (!code) {
    return {};
  }

  const doc = await PromoCode.findOne({ code }).lean();
  if (!doc || !doc.isActive) {
    return { error: "Invalid or inactive promo code" };
  }

  const now = new Date();
  if (doc.validFrom && now < new Date(doc.validFrom)) {
    return { error: "Promo not active yet" };
  }
  if (doc.validUntil && now > new Date(doc.validUntil)) {
    return { error: "Promo has expired" };
  }
  if (doc.maxUses != null && doc.usedCount >= doc.maxUses) {
    return { error: "Promo usage limit reached" };
  }

  const slugs = Array.isArray(doc.courseSlugs) ? doc.courseSlugs : [];
  const slug = String(course.slug || "").toLowerCase();
  if (slugs.length > 0 && !slugs.map((s) => String(s).toLowerCase()).includes(slug)) {
    return { error: "This code does not apply to this course" };
  }

  if (doc.discountType === "percent") {
    const v = Number(doc.discountValue);
    if (v < 1 || v > 100) {
      return { error: "Invalid promo configuration" };
    }
  } else if (Number(doc.discountValue) <= 0) {
    return { error: "Invalid promo configuration" };
  }

  return { doc };
}

/**
 * @param {number} afterCourseDiscount - major units
 * @param {object|null} promoDoc - PromoCode lean doc
 * @param {string} courseCurrency
 */
function applyPromoToAmount(afterCourseDiscount, promoDoc, courseCurrency) {
  if (!promoDoc) {
    return { afterPromo: afterCourseDiscount, promoSaved: 0 };
  }
  const p = applyPromo(afterCourseDiscount, promoDoc, courseCurrency);
  if (p.error === "promo_currency_mismatch") {
    return {
      afterPromo: afterCourseDiscount,
      promoSaved: 0,
      error: "Promo currency does not match this course",
    };
  }
  return { afterPromo: p.final, promoSaved: p.saved };
}

module.exports = { validatePromoForCourse, applyPromoToAmount };
