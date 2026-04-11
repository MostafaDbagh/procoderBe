const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    /** Primary instructor for this course (one instructor per course). Also see User.assignedCourses. */
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    slug: { type: String, required: true, unique: true },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
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
    /** Cover image: Cloudinary HTTPS URL or local `/uploads/courses/...`. */
    imageUrl: { type: String, default: "" },
    /** Cloudinary public_id (folder `courses/...`); for replace/delete. */
    imagePublicId: { type: String, default: "" },
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
    /** 0 = none. 1–100 = percent off `price` for display, enrollments, and quotes. */
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    enrollmentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
