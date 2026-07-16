const ExplorerRequest = require("../models/ExplorerRequest");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whitelist body fields so extra keys (e.g. antispam `_hp`/`_t`) never persist. */
function pickPayload(body) {
  const answers = Array.isArray(body.answers)
    ? body.answers.slice(0, 12).map((a) => ({
        id: String(a?.id ?? "").slice(0, 64),
        question: String(a?.question ?? "").slice(0, 300),
        value: String(a?.value ?? "").slice(0, 120),
        label: String(a?.label ?? "").slice(0, 300),
      }))
    : [];
  return {
    type: body.type,
    locale: body.locale === "ar" ? "ar" : "en",
    parentName: body.parentName,
    email: body.email,
    phone: body.phone,
    childName: body.childName,
    childAge: body.childAge,
    childLanguage: body.childLanguage,
    preferredMethod: body.preferredMethod,
    preferredTime: body.preferredTime,
    note: body.note,
    fitOutcome: body.fitOutcome,
    answers,
    consent: body.consent === true || body.consent === "true",
  };
}

exports.create = async (req, res) => {
  try {
    const doc = await ExplorerRequest.create(pickPayload(req.body));
    res
      .status(201)
      .json({ message: "Explorer request received", id: doc._id });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.list = async (req, res) => {
  try {
    const { type, status, q, from, to } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { parentName: rx },
        { email: rx },
        { childName: rx },
        { note: rx },
      ];
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 15,
      maxLimit: 100,
    });
    const [total, items] = await Promise.all([
      ExplorerRequest.countDocuments(filter),
      ExplorerRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({ items, ...paginationMeta(total, page, limit) });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const doc = await ExplorerRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(doc);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await ExplorerRequest.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    sendServerError(res, error);
  }
};
