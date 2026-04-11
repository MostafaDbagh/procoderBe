const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const PromoCode = require("../models/PromoCode");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { buildPricingForCourse } = require("../services/enrollmentPricing");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toBool(v) {
  return v === true || v === "true";
}

exports.create = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const childName = String(req.body.childName || "").trim();
    const childStudentId = String(req.body.childStudentId || "").trim();
    const courseId = String(req.body.courseId || "").trim();
    const promoCodeRaw = String(req.body.promoCode || "").trim();

    if (!email || !childName || !courseId) {
      return res
        .status(400)
        .json({ message: "Email, child name, and course are required" });
    }

    const course = await Course.findOne({ slug: courseId, isActive: true });
    if (!course) {
      return res
        .status(400)
        .json({ message: "Course not found or not available for enrollment" });
    }

    const activeStatus = { status: { $nin: ["cancelled"] } };
    const duplicate =
      childStudentId === ""
        ? await Enrollment.findOne({
            courseId,
            email,
            childName,
            ...activeStatus,
            $or: [
              { childStudentId: "" },
              { childStudentId: { $exists: false } },
              { childStudentId: null },
            ],
          })
        : await Enrollment.findOne({
            courseId,
            email,
            childName,
            childStudentId,
            ...activeStatus,
          });
    if (duplicate) {
      return res.status(400).json({
        message:
          "This child already has an active enrollment for this course.",
      });
    }

    const pricing = await buildPricingForCourse(course, {
      parentEmail: email,
      promoCodeRaw,
    });
    if (promoCodeRaw && pricing.promoError) {
      return res.status(400).json({ message: pricing.promoError });
    }
    if (promoCodeRaw && !pricing.promoDoc) {
      return res.status(400).json({ message: "Invalid promo code" });
    }
    const promoDoc = pricing.promoDoc;

    const enrollmentPayload = {
      parentName: String(req.body.parentName || "").trim(),
      email,
      phone: String(req.body.phone || "").trim(),
      relationship: String(req.body.relationship || "").trim(),
      childName,
      childStudentId,
      childAge: Number(req.body.childAge),
      childGender: req.body.childGender
        ? String(req.body.childGender).trim()
        : undefined,
      gradeLevel: String(req.body.gradeLevel || "").trim(),
      schoolName: req.body.schoolName
        ? String(req.body.schoolName).trim()
        : undefined,
      previousExperience: req.body.previousExperience
        ? String(req.body.previousExperience).trim()
        : undefined,
      courseId,
      courseTitle: req.body.courseTitle
        ? String(req.body.courseTitle).trim()
        : undefined,
      preferredDays: Array.isArray(req.body.preferredDays)
        ? req.body.preferredDays
        : [],
      preferredTime: String(req.body.preferredTime || "").trim(),
      timezone: req.body.timezone
        ? String(req.body.timezone).trim()
        : undefined,
      sessionFormat: String(req.body.sessionFormat || "").trim(),
      startDate: req.body.startDate
        ? String(req.body.startDate).trim()
        : undefined,
      learningGoals: req.body.learningGoals
        ? String(req.body.learningGoals).trim()
        : undefined,
      specialNeeds: req.body.specialNeeds
        ? String(req.body.specialNeeds).trim()
        : undefined,
      howDidYouHear: req.body.howDidYouHear
        ? String(req.body.howDidYouHear).trim()
        : undefined,
      agreeTerms: toBool(req.body.agreeTerms),
      agreePhotos: toBool(req.body.agreePhotos),
      listPrice: pricing.listPrice,
      currency: pricing.currency,
      courseDiscountPercent: pricing.courseDiscountPercent,
      priceAfterCourseDiscount: pricing.priceAfterCourseDiscount,
      firstTimeParentDiscountPercent: pricing.firstTimeParentDiscountPercent,
      firstTimeParentDiscountAmount: pricing.firstTimeParentDiscountAmount,
      priceAfterFirstTimeDiscount: pricing.priceAfterFirstTimeDiscount,
      promoCodeApplied: promoDoc ? promoDoc.code : null,
      promoDiscountAmount: pricing.promoDiscountAmount,
      amountDue: pricing.amountDue,
    };

    const pricingOut = {
      listPrice: pricing.listPrice,
      currency: pricing.currency,
      courseDiscountPercent: pricing.courseDiscountPercent,
      priceAfterCourseDiscount: pricing.priceAfterCourseDiscount,
      firstTimeParentDiscountPercent: pricing.firstTimeParentDiscountPercent,
      firstTimeParentDiscountAmount: pricing.firstTimeParentDiscountAmount,
      priceAfterFirstTimeDiscount: pricing.priceAfterFirstTimeDiscount,
      promoCodeApplied: enrollmentPayload.promoCodeApplied,
      promoDiscountAmount: pricing.promoDiscountAmount,
      amountDue: pricing.amountDue,
    };

    const respond = (enrollment) => {
      res.status(201).json({
        message: "Enrollment created successfully",
        enrollment: { id: enrollment._id, status: enrollment.status },
        pricing: pricingOut,
      });
    };

    if (promoDoc) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const [enrollment] = await Enrollment.create([enrollmentPayload], {
          session,
        });

        const inc = await PromoCode.findOneAndUpdate(
          {
            _id: promoDoc._id,
            $or: [
              { maxUses: null },
              { $expr: { $lt: ["$usedCount", "$maxUses"] } },
            ],
          },
          { $inc: { usedCount: 1 } },
          { session, new: true }
        );
        if (!inc) {
          throw new Error("PROMO_EXHAUSTED");
        }

        await Course.updateOne(
          { slug: enrollment.courseId },
          { $inc: { enrollmentCount: 1 } },
          { session }
        );

        await session.commitTransaction();
        respond(enrollment);
      } catch (e) {
        await session.abortTransaction();
        if (e.message === "PROMO_EXHAUSTED") {
          return res
            .status(400)
            .json({ message: "Promo is no longer available" });
        }
        throw e;
      } finally {
        session.endSession();
      }
    } else {
      const enrollment = await Enrollment.create(enrollmentPayload);
      await Course.updateOne(
        { slug: enrollment.courseId },
        { $inc: { enrollmentCount: 1 } }
      );
      respond(enrollment);
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Duplicate enrollment: this child is already enrolled in this course.",
      });
    }
    sendServerError(res, error);
  }
};

exports.list = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" ? {} : { email: req.user.email };

    if (req.user.role === "admin") {
      const { status, courseId, q, from, to } = req.query;
      if (status) filter.status = status;
      if (courseId) filter.courseId = courseId;
      if (q) {
        const rx = new RegExp(escapeRegex(q), "i");
        filter.$or = [
          { email: rx },
          { parentName: rx },
          { childName: rx },
          { phone: rx },
        ];
      }
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }
    }

    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 15,
      maxLimit: 100,
    });
    const [total, enrollments] = await Promise.all([
      Enrollment.countDocuments(filter),
      Enrollment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({
      items: enrollments,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.updateStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    res.json(enrollment);
  } catch (error) {
    sendServerError(res, error);
  }
};

const PAYMENT_STATUSES = ["none", "paid", "half", "deposit_15"];

exports.updatePaymentStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const paymentStatus = String(req.body.paymentStatus || "");
  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }

  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    res.json(enrollment);
  } catch (error) {
    sendServerError(res, error);
  }
};
