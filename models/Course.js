const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["programming", "robotics", "algorithms", "arabic", "quran"],
      required: true,
    },
    ageMin: { type: Number, required: true },
    ageMax: { type: Number, required: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    lessons: { type: Number, required: true },
    durationWeeks: { type: Number, required: true },
    iconName: { type: String, default: "BookOpen" },
    color: { type: String, default: "from-blue-400 to-cyan-400" },
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    description: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    skills: {
      en: [String],
      ar: [String],
    },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    isActive: { type: Boolean, default: true },
    enrollmentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
