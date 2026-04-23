const { PricingPlan, PricingDiscount, PricingFaq } = require("../models/Pricing");
const { sendServerError } = require("../utils/safeErrorResponse");

// ── Public ────────────────────────────────────────────────────────────────────

exports.getPublic = async (req, res) => {
  try {
    const [plans, discounts, faqs] = await Promise.all([
      PricingPlan.find({ isActive: true }).sort("order").lean(),
      PricingDiscount.find({ isActive: true }).sort("order").lean(),
      PricingFaq.find({ isActive: true }).sort("order").lean(),
    ]);
    res.json({ plans, discounts, faqs });
  } catch (err) {
    sendServerError(res, err);
  }
};

// ── Admin — Plans ─────────────────────────────────────────────────────────────

exports.listPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.find().sort("order").lean();
    res.json(plans);
  } catch (err) {
    sendServerError(res, err);
  }
};

exports.upsertPlan = async (req, res) => {
  try {
    const plan = await PricingPlan.findOneAndUpdate(
      { key: req.body.key },
      req.body,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(plan);
  } catch (err) {
    sendServerError(res, err);
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const deleted = await PricingPlan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    sendServerError(res, err);
  }
};

// ── Admin — Discounts ─────────────────────────────────────────────────────────

exports.listDiscounts = async (req, res) => {
  try {
    const discounts = await PricingDiscount.find().sort("order").lean();
    res.json(discounts);
  } catch (err) {
    sendServerError(res, err);
  }
};

exports.upsertDiscount = async (req, res) => {
  try {
    const discount = await PricingDiscount.findOneAndUpdate(
      { key: req.body.key },
      req.body,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(discount);
  } catch (err) {
    sendServerError(res, err);
  }
};

exports.deleteDiscount = async (req, res) => {
  try {
    const deleted = await PricingDiscount.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    sendServerError(res, err);
  }
};

// ── Admin — FAQs ──────────────────────────────────────────────────────────────

exports.listFaqs = async (req, res) => {
  try {
    const faqs = await PricingFaq.find().sort("order").lean();
    res.json(faqs);
  } catch (err) {
    sendServerError(res, err);
  }
};

exports.upsertFaq = async (req, res) => {
  try {
    const faq = req.body._id
      ? await PricingFaq.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true })
      : await PricingFaq.create(req.body);
    res.json(faq);
  } catch (err) {
    sendServerError(res, err);
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const deleted = await PricingFaq.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    sendServerError(res, err);
  }
};
