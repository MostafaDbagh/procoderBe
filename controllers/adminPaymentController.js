const Stripe = require("stripe");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Payment = require("../models/Payment");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { priceAfterCourseDiscount } = require("../utils/pricing");

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
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
 * Create a Stripe Checkout Session for an enrollment (course list price).
 * successUrl / cancelUrl should point to your Next admin or parent site.
 */
exports.createCheckoutSession = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      message:
        "Stripe is not configured (set STRIPE_SECRET_KEY on stem-Be).",
    });
  }

  try {
    const enrollmentId = String(req.body.enrollmentId || "").trim();
    if (!enrollmentId) {
      return res.status(400).json({ message: "enrollmentId is required" });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const course = await Course.findOne({ slug: enrollment.courseId }).lean();
    if (!course) {
      return res.status(400).json({ message: "Course not found for enrollment" });
    }

    const currency = "usd";
    const amountMajor =
      enrollment.amountDue != null && Number(enrollment.amountDue) > 0
        ? Number(enrollment.amountDue)
        : priceAfterCourseDiscount(course);
    const unitAmount = Math.round(amountMajor * 100);
    if (!Number.isFinite(unitAmount) || unitAmount < 1) {
      return res.status(400).json({
        message:
          "Amount due must be greater than zero before creating Stripe Checkout (set course price and discounts).",
      });
    }

    const base =
      process.env.CLIENT_URL ||
      process.env.ADMIN_CHECKOUT_BASE_URL ||
      "http://localhost:3000";
    const successUrl =
      String(req.body.successUrl || "").trim() ||
      `${base.replace(/\/$/, "")}/admin/dashboard?checkout=success`;
    const cancelUrl =
      String(req.body.cancelUrl || "").trim() ||
      `${base.replace(/\/$/, "")}/admin/dashboard?checkout=cancel`;
    const successSep = successUrl.includes("?") ? "&" : "?";

    const titleEn = course.title?.en || enrollment.courseId;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${successUrl}${successSep}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { enrollmentId: String(enrollment._id) },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: `${titleEn} — ${enrollment.childName}`,
              description: `Enrollment ${enrollment._id}`,
            },
          },
        },
      ],
    });

    await Payment.findOneAndUpdate(
      { stripeCheckoutSessionId: session.id },
      {
        $set: {
          enrollment: enrollment._id,
          amountCents: unitAmount,
          currency: currency.toUpperCase(),
          status: "pending",
          stripeCheckoutSessionId: session.id,
          description: "Stripe Checkout",
          metadata: { courseSlug: enrollment.courseId },
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};
