const ParentFeedback = require("../models/ParentFeedback");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.list = async (req, res) => {
  try {
    const { status, category, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { parentName: rx },
        { parentEmail: rx },
        { parentPhone: rx },
        { message: rx },
      ];
    }

    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 15,
      maxLimit: 100,
    });

    const [total, items] = await Promise.all([
      ParentFeedback.countDocuments(filter),
      ParentFeedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    res.json({
      items,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const patch = {};
    if (req.body.status !== undefined) patch.status = req.body.status;
    if (req.body.adminNote !== undefined) patch.adminNote = String(req.body.adminNote || "").trim();

    const feedback = await ParentFeedback.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json(feedback);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await ParentFeedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    sendServerError(res, error);
  }
};
