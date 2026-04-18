const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    description: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    requirements: {
      en: { type: String, default: "" },
      ar: { type: String, default: "" },
    },
    department: {
      type: String,
      enum: ["engineering", "education", "design", "marketing", "operations", "support", "other"],
      default: "other",
    },
    location: { type: String, default: "Remote" },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      default: "full-time",
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead"],
      default: "mid",
    },
    skills: [String],
    isActive: { type: Boolean, default: true },
    applicationEmail: { type: String, default: "" },
    applicationUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

careerSchema.index({ isActive: 1, createdAt: -1 });
careerSchema.index({ department: 1 });

module.exports = mongoose.model("Career", careerSchema);
