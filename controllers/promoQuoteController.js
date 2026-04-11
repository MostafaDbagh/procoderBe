const Course = require("../models/Course");
const { priceAfterCourseDiscount } = require("../utils/pricing");
const { validatePromoForCourse, applyPromoToAmount } = require("../services/promoApply");
const { sendServerError } = require("../utils/safeErrorResponse");

exports.quote = async (req, res) => {
  try {
    const courseId = String(req.body.courseId || "").trim();
    const promoCode = String(req.body.promoCode || "").trim();
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await Course.findOne({ slug: courseId, isActive: true }).lean();
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const listPrice = Math.round((Number(course.price) || 0) * 100) / 100;
    const currency = "USD";
    const courseDiscountPercent = Math.min(
      100,
      Math.max(0, Number(course.discountPercent) || 0)
    );
    const afterCourse = priceAfterCourseDiscount(course);

    let promoError = null;
    let promoApplied = null;
    let promoDiscountAmount = 0;
    let amountDue = afterCourse;

    if (promoCode) {
      const v = await validatePromoForCourse(promoCode, course);
      if (v.error) {
        promoError = v.error;
      } else if (v.doc) {
        const ap = applyPromoToAmount(afterCourse, v.doc, currency);
        if (ap.error) {
          promoError = ap.error;
        } else {
          amountDue = ap.afterPromo;
          promoDiscountAmount = ap.promoSaved;
          promoApplied = {
            code: v.doc.code,
            discountType: v.doc.discountType,
            discountValue: v.doc.discountValue,
          };
        }
      }
    }

    res.json({
      courseId: course.slug,
      currency,
      listPrice,
      courseDiscountPercent,
      priceAfterCourseDiscount: afterCourse,
      promoCode: promoCode ? promoCode.toUpperCase() : null,
      promoError,
      promoApplied,
      promoDiscountAmount,
      amountDue,
    });
  } catch (e) {
    sendServerError(res, e);
  }
};
