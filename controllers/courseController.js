const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { dedupeBySlugKeepNewest } = require("../utils/adminListDedupeBySlug");
const { destroyCloudinaryImage } = require("../utils/teamPhotoCloudinary");
const { uploadUsesCloudinary } = require("../middleware/courseImageUpload");

exports.uploadCourseImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No image file (use field name photo)" });
    }
    if (uploadUsesCloudinary()) {
      const photoUrl = req.file.path;
      const photoPublicId = req.file.filename;
      return res.status(201).json({ photoUrl, photoPublicId });
    }
    const photoUrl = `/uploads/courses/${req.file.filename}`;
    res.status(201).json({ photoUrl, photoPublicId: "" });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.list = async (req, res) => {
  try {
    const { category, level, ageMin, ageMax } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (ageMin) filter.ageMax = { $gte: Number(ageMin) };
    if (ageMax) filter.ageMin = { $lte: Number(ageMax) };

    const courses = await Course.find(filter).sort({ category: 1, ageMin: 1 });
    res.json(courses);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.listAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  try {
    const { category, level, active } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 15,
      maxLimit: 100,
    });
    const matchStages =
      Object.keys(filter).length > 0 ? [{ $match: filter }] : [];
    const pipelineBase = [
      ...matchStages,
      ...dedupeBySlugKeepNewest(),
      { $sort: { category: 1, ageMin: 1 } },
    ];
    const [countResult, courses] = await Promise.all([
      Course.aggregate([...pipelineBase, { $count: "total" }]),
      Course.aggregate([...pipelineBase, { $skip: skip }, { $limit: limit }]),
    ]);
    const total = countResult[0]?.total ?? 0;
    res.json({
      items: courses,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getBySlugAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  try {
    const course = await Course.findOne({ slug: req.params.slug }).sort({
      updatedAt: -1,
    });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.create = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const course = await Course.create({ ...req.body, currency: "USD" });
    res.status(201).json(course);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Course slug already exists" });
    }
    sendServerError(res, error);
  }
};

exports.update = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const existing = await Course.findOne({ slug: req.params.slug }).sort({
      updatedAt: -1,
    });
    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }

    const oldPid = String(existing.imagePublicId || "").trim();
    if (oldPid) {
      const urlCleared =
        Object.prototype.hasOwnProperty.call(req.body, "imageUrl") &&
        String(req.body.imageUrl || "").trim() === "";
      const newPidRaw = Object.prototype.hasOwnProperty.call(
        req.body,
        "imagePublicId"
      )
        ? String(req.body.imagePublicId || "").trim()
        : null;

      if (urlCleared) {
        await destroyCloudinaryImage(oldPid);
      } else if (newPidRaw !== null && newPidRaw !== oldPid && newPidRaw) {
        await destroyCloudinaryImage(oldPid);
      } else if (
        newPidRaw !== null &&
        newPidRaw === "" &&
        Object.prototype.hasOwnProperty.call(req.body, "imageUrl")
      ) {
        const u = String(req.body.imageUrl || "").trim();
        if (u && !u.includes("res.cloudinary.com")) {
          await destroyCloudinaryImage(oldPid);
        }
      }
    }

    const upd = await Course.updateMany(
      { slug: req.params.slug },
      { ...req.body, currency: "USD" },
      { runValidators: true }
    );
    if (upd.matchedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    const course = await Course.findOne({ slug: req.params.slug }).sort({
      updatedAt: -1,
    });
    res.json(course);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.remove = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    const rows = await Course.find({ slug }).lean();
    if (rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    const pids = [
      ...new Set(
        rows
          .map((r) => String(r.imagePublicId || "").trim())
          .filter(Boolean)
      ),
    ];
    for (const pid of pids) {
      await destroyCloudinaryImage(pid);
    }
    await Course.updateMany(
      { slug },
      { $set: { isActive: false, imageUrl: "", imagePublicId: "" } }
    );
    res.json({ message: "Course deactivated" });
  } catch (error) {
    sendServerError(res, error);
  }
};

/** Permanent delete (admin). Blocked if any enrollment references this course slug. */
exports.removePermanent = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    const rows = await Course.find({ slug }).lean();
    if (rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrollmentCount = await Enrollment.countDocuments({ courseId: slug });
    if (enrollmentCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${enrollmentCount} enrollment(s) use this course. Deactivate it instead, or cancel/remove those enrollments first.`,
      });
    }

    const pids = [
      ...new Set(
        rows
          .map((r) => String(r.imagePublicId || "").trim())
          .filter(Boolean)
      ),
    ];
    for (const pid of pids) {
      await destroyCloudinaryImage(pid);
    }
    await Course.deleteMany({ slug });
    res.json({ message: "Course deleted permanently" });
  } catch (error) {
    sendServerError(res, error);
  }
};
