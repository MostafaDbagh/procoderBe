const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    /** Percent: 1–100. Fixed: amount in major currency units (matches `currency`). */
    discountValue: { type: Number, required: true },
    currency: { type: String, default: "USD", uppercase: true },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    /** Empty = all courses */
    courseSlugs: [{ type: String, lowercase: true, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

promoCodeSchema.index({ isActive: 1, code: 1 });

module.exports = mongoose.model("PromoCode", promoCodeSchema);
