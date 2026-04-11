const Course = require("../models/Course");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");
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
    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter)
        .sort({ category: 1, ageMin: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
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
    const course = await Course.findOne({ slug: req.params.slug });
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
    const existing = await Course.findOne({ slug: req.params.slug });
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

    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug },
      { ...req.body, currency: "USD" },
      { new: true, runValidators: true }
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
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
    const existing = await Course.findOne({ slug: req.params.slug });
    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (existing.imagePublicId) {
      await destroyCloudinaryImage(existing.imagePublicId);
    }
    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug },
      { isActive: false, imageUrl: "", imagePublicId: "" },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course deactivated" });
  } catch (error) {
    sendServerError(res, error);
  }
};
