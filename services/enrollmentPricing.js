const Enrollment = require("../models/Enrollment");
const Referral = require("../models/Referral");
const { priceAfterCourseDiscount } = require("../utils/pricing");
const { validatePromoForCourse, applyPromoToAmount } = require("./promoApply");

/** One-time percent off for a parent's first enrollment (by email), applied after catalog course discount. */
const FIRST_TIME_PARENT_DISCOUNT_PERCENT = 25;

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * True if this email already has a non-cancelled enrollment (same notion as duplicate checks).
 */
async function hasAnyEnrollmentForEmail(email) {
  const e = String(email || "").toLowerCase().trim();
  if (!e) return false;
  const n = await Enrollment.countDocuments({
    email: e,
    status: { $nin: ["cancelled"] },
  });
  return n > 0;
}

/**
 * @param {boolean} eligible - from !hasAnyEnrollmentForEmail before create
 */
function applyFirstTimeParentLayer(afterCourse, eligible) {
  const ac = roundMoney(Number(afterCourse) || 0);
  if (!eligible || ac <= 0) {
    return {
      priceAfterFirstTimeDiscount: ac,
      firstTimeParentDiscountPercent: 0,
      firstTimeParentDiscountAmount: 0,
    };
  }
  const firstTimeParentDiscountPercent = FIRST_TIME_PARENT_DISCOUNT_PERCENT;
  const priceAfterFirstTimeDiscount = roundMoney(
    ac * (1 - firstTimeParentDiscountPercent / 100)
  );
  const firstTimeParentDiscountAmount = roundMoney(
    ac - priceAfterFirstTimeDiscount
  );
  return {
    priceAfterFirstTimeDiscount,
    firstTimeParentDiscountPercent,
    firstTimeParentDiscountAmount,
  };
}

async function buildPricingForCourse(course, opts = {}) {
  const parentEmail = opts.parentEmail
    ? String(opts.parentEmail).toLowerCase().trim()
    : "";
  const promoCodeRaw = String(opts.promoCodeRaw || "").trim();

  const listPrice = roundMoney(Number(course.price) || 0);
  const currency = "USD";
  const courseDiscountPercent = Math.min(
    100,
    Math.max(0, Number(course.discountPercent) || 0)
  );
  const afterCourse = priceAfterCourseDiscount(course);

  const firstTimeEligible =
    parentEmail.length > 0 && !(await hasAnyEnrollmentForEmail(parentEmail));
  const ft = applyFirstTimeParentLayer(afterCourse, firstTimeEligible);

  let promoError = null;
  let promoApplied = null;
  let promoDiscountAmount = 0;
  let amountDue = ft.priceAfterFirstTimeDiscount;
  let promoDoc = null;
  let referralDoc = null;

  if (promoCodeRaw) {
    const v = await validatePromoForCourse(promoCodeRaw, course);
    if (v.error) {
      // Fall back: check if the code is a referral code
      const ref = await Referral.findOne({
        code: promoCodeRaw.toUpperCase(),
        isActive: true,
      }).lean();
      const selfReferral = ref && parentEmail && ref.referrerEmail.toLowerCase() === parentEmail.toLowerCase();
      const alreadyUsed = ref && parentEmail && ref.referrals.some(
        (r) => String(r.email || "").toLowerCase() === parentEmail.toLowerCase()
      );
      if (ref && selfReferral) {
        promoError = "You cannot use your own referral code.";
      } else if (ref && alreadyUsed) {
        promoError = "You have already used this referral code.";
      } else if (ref && (!ref.maxUses || ref.totalReferred < ref.maxUses)) {
        referralDoc = ref;
        const base = ft.priceAfterFirstTimeDiscount;
        const afterReferral = roundMoney(base * (1 - ref.discountPercent / 100));
        promoDiscountAmount = roundMoney(base - afterReferral);
        amountDue = afterReferral;
        promoApplied = {
          code: ref.code,
          discountType: "percent",
          discountValue: ref.discountPercent,
        };
      } else {
        promoError = v.error;
      }
    } else if (v.doc) {
      const ap = applyPromoToAmount(
        ft.priceAfterFirstTimeDiscount,
        v.doc,
        currency
      );
      if (ap.error) {
        promoError = ap.error;
      } else {
        amountDue = ap.afterPromo;
        promoDiscountAmount = ap.promoSaved;
        promoDoc = v.doc;
        promoApplied = {
          code: v.doc.code,
          discountType: v.doc.discountType,
          discountValue: v.doc.discountValue,
        };
      }
    }
  }

  return {
    listPrice,
    currency,
    courseDiscountPercent,
    priceAfterCourseDiscount: afterCourse,
    firstTimeParentDiscountPercent: ft.firstTimeParentDiscountPercent,
    firstTimeParentDiscountAmount: ft.firstTimeParentDiscountAmount,
    priceAfterFirstTimeDiscount: ft.priceAfterFirstTimeDiscount,
    promoError,
    promoApplied,
    promoCodeNormalized: promoCodeRaw ? promoCodeRaw.toUpperCase() : null,
    promoDiscountAmount,
    amountDue,
    promoDoc,
    referralDoc,
  };
}

module.exports = {
  FIRST_TIME_PARENT_DISCOUNT_PERCENT,
  roundMoney,
  hasAnyEnrollmentForEmail,
  applyFirstTimeParentLayer,
  buildPricingForCourse,
};
