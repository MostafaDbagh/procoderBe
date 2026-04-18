const PromoCode = require("../models/PromoCode");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

exports.getById = async (req, res) => {
 try {
 const row = await PromoCode.findById(req.params.id).lean();
 if (!row) return res.status(404).json({ message: "Not found" });
 res.json(row);
 } catch (e) {
 sendServerError(res, e);
 }
};

exports.list = async (req, res) => {
 try {
 const filter = {};
 if (req.query.active === "true") filter.isActive = true;
 if (req.query.active === "false") filter.isActive = false;
 if (req.query.q) {
 filter.code = new RegExp(
 String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
 "i"
 );
 }
 const { page, limit, skip } = parsePagination(req.query, {
 defaultLimit: 15,
 maxLimit: 100,
 });
 const [total, items] = await Promise.all([
 PromoCode.countDocuments(filter),
 PromoCode.find(filter)
 .sort({ createdAt: -1 })
 .skip(skip)
 .limit(limit)
 .lean(),
 ]);
 res.json({ items, ...paginationMeta(total, page, limit) });
 } catch (e) {
 sendServerError(res, e);
 }
};

exports.create = async (req, res) => {
 try {
 const body = { ...req.body };
 if (body.discountType === "percent" && Number(body.discountValue) > 100) {
 return res
 .status(400)
 .json({ message: "Percent discount cannot exceed 100" });
 }
 body.code = String(body.code || "")
 .toUpperCase()
 .trim();
 if (Array.isArray(body.courseSlugs)) {
 body.courseSlugs = body.courseSlugs
 .map((s) => String(s).toLowerCase().trim())
 .filter(Boolean);
 }
 body.currency = "USD";
 const row = await PromoCode.create(body);
 res.status(201).json(row);
 } catch (e) {
 if (e.code === 11000) {
 return res.status(400).json({ message: "Promo code already exists" });
 }
 sendServerError(res, e);
 }
};

exports.patch = async (req, res) => {
 try {
 const id = req.params.id;
 const $set = { ...req.body };
 delete $set.code;
 delete $set.usedCount;
 if ($set.discountType === "percent" && Number($set.discountValue) > 100) {
 return res
 .status(400)
 .json({ message: "Percent discount cannot exceed 100" });
 }
 if (Array.isArray($set.courseSlugs)) {
 $set.courseSlugs = $set.courseSlugs
 .map((s) => String(s).toLowerCase().trim())
 .filter(Boolean);
 }
 $set.currency = "USD";
 const row = await PromoCode.findByIdAndUpdate(id, $set, {
 new: true,
 runValidators: true,
 });
 if (!row) return res.status(404).json({ message: "Not found" });
 res.json(row);
 } catch (e) {
 sendServerError(res, e);
 }
};

exports.remove = async (req, res) => {
 try {
 const row = await PromoCode.findByIdAndDelete(req.params.id);
 if (!row) return res.status(404).json({ message: "Not found" });
 res.json({ message: "Deleted" });
 } catch (e) {
 sendServerError(res, e);
 }
};
