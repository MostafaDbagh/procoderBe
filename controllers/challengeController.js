const MonthlyChallenge = require("../models/MonthlyChallenge");
const { sendServerError } = require("../utils/safeErrorResponse");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.listPublicLatest = async (req, res) => {
  try {
    const doc = await MonthlyChallenge.findOne({ isPublished: true })
      .sort({ monthKey: -1, updatedAt: -1 })
      .lean();
    if (!doc) {
      return res.status(404).json({ message: "No published challenge" });
    }
    res.json(doc);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.list = async (req, res) => {
  try {
    const { q, monthKey, published } = req.query;
    const filter = {};
    if (monthKey) filter.monthKey = monthKey;
    if (published === "true") filter.isPublished = true;
    if (published === "false") filter.isPublished = false;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { slug: rx },
        { titleEn: rx },
        { titleAr: rx },
        { monthKey: rx },
      ];
    }
    const rows = await MonthlyChallenge.find(filter)
      .sort({ monthKey: -1, createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await MonthlyChallenge.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const doc = await MonthlyChallenge.create(req.body);
    res.status(201).json(doc);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slug already exists" });
    }
    sendServerError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const doc = await MonthlyChallenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const doc = await MonthlyChallenge.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    sendServerError(res, error);
  }
};
