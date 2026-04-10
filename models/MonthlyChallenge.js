const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  {
    titleEn: { type: String, default: "" },
    titleAr: { type: String, default: "" },
    bodyEn: { type: String, default: "" },
    bodyAr: { type: String, default: "" },
  },
  { _id: false }
);

const monthlyChallengeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    /** Sort key e.g. 2026-04 */
    monthKey: { type: String, required: true, trim: true },
    badgeEn: { type: String, default: "" },
    badgeAr: { type: String, default: "" },
    titleEn: { type: String, required: true },
    titleAr: { type: String, required: true },
    subtitleEn: { type: String, default: "" },
    subtitleAr: { type: String, default: "" },
    steps: { type: [stepSchema], default: [] },
    hintBodyEn: { type: String, default: "" },
    hintBodyAr: { type: String, default: "" },
    formTitleEn: { type: String, default: "" },
    formTitleAr: { type: String, default: "" },
    formSubtitleEn: { type: String, default: "" },
    formSubtitleAr: { type: String, default: "" },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MonthlyChallenge", monthlyChallengeSchema);
