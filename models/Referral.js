const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    // Who created the referral code
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referrerEmail: { type: String, required: true },
    referrerName: { type: String, required: true },
    // Unique referral code
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    // Discount settings
    discountPercent: { type: Number, default: 15, min: 0, max: 100 },
    // Referred families
    referrals: [
      {
        name: String,
        email: String,
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
        enrolledAt: { type: Date, default: Date.now },
        courseId: String,
      },
    ],
    // Limits
    maxUses: { type: Number, default: null }, // null = unlimited
    isActive: { type: Boolean, default: true },
    // Stats
    totalReferred: { type: Number, default: 0 },
    totalRevenueSaved: { type: Number, default: 0 },
  },
  { timestamps: true }
);

referralSchema.index({ code: 1 });
referralSchema.index({ referrer: 1 });
referralSchema.index({ referrerEmail: 1 });

module.exports = mongoose.model("Referral", referralSchema);
