const Category = require("../models/Category");
const Course = require("../models/Course");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { sendServerError } = require("../utils/safeErrorResponse");

exports.list = async (req, res) => {
  try {
    const rows = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, slug: 1 })
      .lean();
    res.json(rows);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.listAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 15,
      maxLimit: 500,
    });
    const [total, rows] = await Promise.all([
      Category.countDocuments({}),
      Category.find({})
        .sort({ sortOrder: 1, slug: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({
      items: rows,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const row = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    }).lean();
    if (!row) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(row);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getBySlugAdmin = async (req, res) => {
  try {
    const row = await Category.findOne({ slug: req.params.slug }).lean();
    if (!row) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(row);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const slug = String(req.body.slug || "")
      .trim()
      .toLowerCase();
    const row = await Category.create({
      slug,
      title: {
        en: String(req.body.title?.en || "").trim(),
        ar: String(req.body.title?.ar || "").trim(),
      },
      sortOrder:
        req.body.sortOrder !== undefined
          ? Number(req.body.sortOrder)
          : undefined,
      isActive:
        req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
    });
    res.status(201).json(row);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category slug already exists" });
    }
    sendServerError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const slug = String(req.params.slug).trim().toLowerCase();
    const { title, sortOrder, isActive } = req.body;
    const $set = {};
    if (title && typeof title === "object") {
      if (title.en !== undefined) $set["title.en"] = String(title.en).trim();
      if (title.ar !== undefined) $set["title.ar"] = String(title.ar).trim();
    }
    if (sortOrder !== undefined) $set.sortOrder = Number(sortOrder);
    if (isActive !== undefined) $set.isActive = Boolean(isActive);

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const row = await Category.findOneAndUpdate({ slug }, $set, {
      new: true,
      runValidators: true,
    });
    if (!row) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(row);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const slug = String(req.params.slug).trim().toLowerCase();
    const used = await Course.countDocuments({ category: slug });
    if (used > 0) {
      const row = await Category.findOneAndUpdate(
        { slug },
        { $set: { isActive: false } },
        { new: true }
      );
      if (!row) {
        return res.status(404).json({ message: "Category not found" });
      }
      return res.json({
        message: "Category deactivated (courses still reference this slug)",
        category: row,
      });
    }
    const deleted = await Category.findOneAndDelete({ slug });
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted" });
  } catch (error) {
    sendServerError(res, error);
  }
};
