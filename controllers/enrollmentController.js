const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const PromoCode = require("../models/PromoCode");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { priceAfterCourseDiscount } = require("../utils/pricing");
const { validatePromoForCourse, applyPromoToAmount } = require("../services/promoApply");

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
          "This child already has an active enrollment for this course. If another child shares the same name, add a unique Student ID on the form.",
      });
    }

    const listPrice = Math.round((Number(course.price) || 0) * 100) / 100;
    const currency = String(course.currency || "USD").toUpperCase();
    const courseDiscountPercent = Math.min(
      100,
      Math.max(0, Number(course.discountPercent) || 0)
    );
    const afterCourse = priceAfterCourseDiscount(course);

    let promoDoc = null;
    if (promoCodeRaw) {
      const v = await validatePromoForCourse(promoCodeRaw, course.toObject());
      if (v.error) {
        return res.status(400).json({ message: v.error });
      }
      promoDoc = v.doc;
    }

    let amountDue = afterCourse;
    let promoDiscountAmount = 0;
    if (promoDoc) {
      const ap = applyPromoToAmount(afterCourse, promoDoc, currency);
      if (ap.error) {
        return res.status(400).json({ message: ap.error });
      }
      amountDue = ap.afterPromo;
      promoDiscountAmount = ap.promoSaved;
    }

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
      listPrice,
      currency,
      courseDiscountPercent,
      priceAfterCourseDiscount: afterCourse,
      promoCodeApplied: promoDoc ? promoDoc.code : null,
      promoDiscountAmount,
      amountDue,
    };

    const pricingOut = {
      listPrice,
      currency,
      courseDiscountPercent,
      priceAfterCourseDiscount: afterCourse,
      promoCodeApplied: enrollmentPayload.promoCodeApplied,
      promoDiscountAmount,
      amountDue,
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
          "Duplicate enrollment: this child is already enrolled in this course (same name and student ID).",
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
