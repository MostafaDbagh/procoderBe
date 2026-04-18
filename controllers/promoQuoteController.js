const Course = require("../models/Course");
const { buildPricingForCourse } = require("../services/enrollmentPricing");
const { sendServerError } = require("../utils/safeErrorResponse");

exports.quote = async (req, res) => {
 try {
 const courseId = String(req.body.courseId || "").trim();
 const promoCode = String(req.body.promoCode || "").trim();
 const parentEmail = String(req.body.parentEmail || "").trim();
 if (!courseId) {
 return res.status(400).json({ message: "courseId is required" });
 }

 const course = await Course.findOne({ slug: courseId, isActive: true }).lean();
 if (!course) {
 return res.status(404).json({ message: "Course not found" });
 }

 const p = await buildPricingForCourse(course, {
 parentEmail: parentEmail || undefined,
 promoCodeRaw: promoCode,
 });

 res.json({
 courseId: course.slug,
 currency: p.currency,
 listPrice: p.listPrice,
 courseDiscountPercent: p.courseDiscountPercent,
 priceAfterCourseDiscount: p.priceAfterCourseDiscount,
 firstTimeParentDiscountPercent: p.firstTimeParentDiscountPercent,
 firstTimeParentDiscountAmount: p.firstTimeParentDiscountAmount,
 priceAfterFirstTimeDiscount: p.priceAfterFirstTimeDiscount,
 promoCode: p.promoCodeNormalized,
 promoError: p.promoError,
 promoApplied: p.promoApplied,
 promoDiscountAmount: p.promoDiscountAmount,
 amountDue: p.amountDue,
 });
 } catch (e) {
 sendServerError(res, e);
 }
};
