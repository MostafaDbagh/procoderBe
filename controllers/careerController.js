const Career = require("../models/Career");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

// ─── PUBLIC ───

exports.listActive = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
    const [total, careers] = await Promise.all([
      Career.countDocuments(filter),
      Career.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({ items: careers, ...paginationMeta(total, page, limit) });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!career) return res.status(404).json({ message: "Position not found" });
    res.json(career);
  } catch (error) {
    sendServerError(res, error);
  }
};

// ─── ADMIN ───

exports.listAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15, maxLimit: 100 });
    const filter = {};
    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;
    if (req.query.department) filter.department = req.query.department;

    const [total, careers] = await Promise.all([
      Career.countDocuments(filter),
      Career.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({ items: careers, ...paginationMeta(total, page, limit) });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getByIdAdmin = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id).lean();
    if (!career) return res.status(404).json({ message: "Position not found" });
    res.json(career);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      slug: String(req.body.slug || req.body.title?.en || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    };
    const career = await Career.create(data);
    res.status(201).json(career);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Career slug already exists" });
    sendServerError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!career) return res.status(404).json({ message: "Position not found" });
    res.json(career);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    if (!career) return res.status(404).json({ message: "Position not found" });
    res.json({ message: "Position deleted" });
  } catch (error) {
    sendServerError(res, error);
  }
};
