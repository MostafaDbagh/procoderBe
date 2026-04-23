const mongoose = require("mongoose");

const localizedString = {
  en: { type: String, default: "" },
  ar: { type: String, default: "" },
};

// ── Plan ──────────────────────────────────────────────────────────────────────
const planSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: localizedString,
    priceDisplay: localizedString,
    period: localizedString,
    description: localizedString,
    features: [localizedString],
    highlighted: { type: Boolean, default: false },
    badge: localizedString,
    ctaHref: { type: String, default: "/" },
    ctaLabel: localizedString,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Discount ──────────────────────────────────────────────────────────────────
const discountSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: localizedString,
    value: localizedString,
    description: localizedString,
    iconColor: { type: String, default: "from-primary to-purple" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── FAQ ───────────────────────────────────────────────────────────────────────
const pricingFaqSchema = new mongoose.Schema(
  {
    question: localizedString,
    answer: localizedString,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  PricingPlan: mongoose.model("PricingPlan", planSchema),
  PricingDiscount: mongoose.model("PricingDiscount", discountSchema),
  PricingFaq: mongoose.model("PricingFaq", pricingFaqSchema),
};
