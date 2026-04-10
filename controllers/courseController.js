const Course = require("../models/Course");
const { sendServerError } = require("../utils/safeErrorResponse");

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
    const courses = await Course.find(filter).sort({ category: 1, ageMin: 1 });
    res.json(courses);
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
    const course = await Course.create(req.body);
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
    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
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
    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug },
      { isActive: false },
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
