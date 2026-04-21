const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Payment = require("../models/Payment");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { priceAfterCourseDiscount } = require("../utils/pricing");

function paymentInstructions(paymentMethod) {
 if (paymentMethod === "bank_transfer") {
 return (
 process.env.PAYMENT_BANK_DETAILS?.trim() ||
 "Configure PAYMENT_BANK_DETAILS on stem-Be (e.g. IBAN, account name, reference) and share these with the family."
 );
 }
 return (
 process.env.PAYMENT_PAYPAL_INFO?.trim() ||
 "Configure PAYMENT_PAYPAL_INFO on stem-Be (e.g. PayPal.me link or email) and share it with the family."
 );
}

exports.list = async (req, res) => {
 try {
 const filter = {};
 if (req.query.status) filter.status = String(req.query.status);
 if (req.query.enrollmentId) filter.enrollment = req.query.enrollmentId;

 const { page, limit, skip } = parsePagination(req.query, {
 defaultLimit: 15,
 maxLimit: 100,
 });
 const [total, items] = await Promise.all([
 Payment.countDocuments(filter),
 Payment.find(filter)
 .sort({ createdAt: -1 })
 .skip(skip)
 .limit(limit)
 .populate("enrollment", "parentName email phone courseId courseTitle amountDue status childName childAge")
 .lean(),
 ]);
 res.json({
 items,
 ...paginationMeta(total, page, limit),
 });
 } catch (error) {
 sendServerError(res, error);
 }
};

/**
 * Create or refresh a pending payment for an enrollment (bank transfer or PayPal).
 */
exports.recordManualPayment = async (req, res) => {
 try {
 const enrollmentId = String(req.body.enrollmentId || "").trim();
 const paymentMethod = String(req.body.paymentMethod || "").trim();
 if (!enrollmentId) {
 return res.status(400).json({ message: "enrollmentId is required" });
 }
 if (!["bank_transfer", "paypal"].includes(paymentMethod)) {
 return res.status(400).json({
 message: "paymentMethod must be bank_transfer or paypal",
 });
 }

 const enrollment = await Enrollment.findById(enrollmentId);
 if (!enrollment) {
 return res.status(404).json({ message: "Enrollment not found" });
 }

 const course = await Course.findOne({ slug: enrollment.courseId }).lean();
 if (!course) {
 return res.status(400).json({ message: "Course not found for enrollment" });
 }

 const amountMajor =
 enrollment.amountDue != null && Number(enrollment.amountDue) > 0
 ? Number(enrollment.amountDue)
 : priceAfterCourseDiscount(course);
 const unitAmount = Math.round(amountMajor * 100);
 if (!Number.isFinite(unitAmount) || unitAmount < 1) {
 return res.status(400).json({
 message:
 "Amount due must be greater than zero (set course price / enrollment amount due).",
 });
 }

 const desc =
 paymentMethod === "bank_transfer"
 ? "Bank transfer (pending)"
 : "PayPal (pending)";

 let payment = await Payment.findOne({
 enrollment: enrollment._id,
 status: { $in: ["pending", "processing"] },
 });
 let created = false;

 if (payment) {
 payment.paymentMethod = paymentMethod;
 payment.amountCents = unitAmount;
 payment.currency = "USD";
 payment.description = desc;
 payment.metadata = {
 ...(payment.metadata && typeof payment.metadata === "object"
 ? payment.metadata
 : {}),
 courseSlug: enrollment.courseId,
 };
 await payment.save();
 } else {
 payment = await Payment.create({
 enrollment: enrollment._id,
 amountCents: unitAmount,
 currency: "USD",
 status: "pending",
 paymentMethod,
 description: desc,
 metadata: { courseSlug: enrollment.courseId },
 });
 created = true;
 }

 const instructions = paymentInstructions(paymentMethod);
 res.status(created ? 201 : 200).json({
 payment,
 instructions,
 amountUsd: unitAmount / 100,
 });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.updateStatus = async (req, res) => {
 try {
 const status = String(req.body.status || "");
 const allowed = [
 "pending",
 "processing",
 "succeeded",
 "failed",
 "refunded",
 "partially_refunded",
 ];
 if (!allowed.includes(status)) {
 return res.status(400).json({ message: "Invalid status" });
 }
 const row = await Payment.findByIdAndUpdate(
 req.params.id,
 { $set: { status } },
 { new: true, runValidators: true }
 );
 if (!row) {
 return res.status(404).json({ message: "Payment not found" });
 }
 res.json(row);
 } catch (error) {
 sendServerError(res, error);
 }
};
