const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { sendServerError } = require("../utils/safeErrorResponse");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.create = async (req, res) => {
  try {
    const enrollment = await Enrollment.create(req.body);
    await Course.updateOne(
      { slug: enrollment.courseId },
      { $inc: { enrollmentCount: 1 } }
    );
    res.status(201).json({
      message: "Enrollment created successfully",
      enrollment: { id: enrollment._id, status: enrollment.status },
    });
  } catch (error) {
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

    const enrollments = await Enrollment.find(filter).sort({ createdAt: -1 });
    res.json(enrollments);
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
