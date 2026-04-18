const Contact = require("../models/Contact");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

function escapeRegex(s) {
 return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.submit = async (req, res) => {
 try {
 const contact = await Contact.create(req.body);
 res
 .status(201)
 .json({ message: "Message sent successfully", id: contact._id });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.list = async (req, res) => {
 try {
 const { status, q, subject, challengeOnly, from, to } = req.query;
 const filter = {};
 if (status) filter.status = status;
 if (challengeOnly === "true") {
 filter.subject = { $regex: /\[StemTechLab Challenge\]/i };
 } else if (subject) {
 filter.subject = new RegExp(escapeRegex(subject), "i");
 }
 if (q) {
 const rx = new RegExp(escapeRegex(q), "i");
 filter.$or = [{ email: rx }, { name: rx }, { message: rx }];
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
 const [total, messages] = await Promise.all([
 Contact.countDocuments(filter),
 Contact.find(filter)
 .sort({ createdAt: -1 })
 .skip(skip)
 .limit(limit)
 .lean(),
 ]);
 res.json({
 items: messages,
 ...paginationMeta(total, page, limit),
 });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.updateStatus = async (req, res) => {
 try {
 const contact = await Contact.findByIdAndUpdate(
 req.params.id,
 { status: req.body.status },
 { new: true, runValidators: true }
 );
 if (!contact) {
 return res.status(404).json({ message: "Not found" });
 }
 res.json(contact);
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.remove = async (req, res) => {
 try {
 const deleted = await Contact.findByIdAndDelete(req.params.id);
 if (!deleted) {
 return res.status(404).json({ message: "Not found" });
 }
 res.json({ message: "Deleted" });
 } catch (error) {
 sendServerError(res, error);
 }
};
