const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    /** Instructors assigned to this course (one or more). Also see User.assignedCourses. */
    instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
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

courseSchema.index({ isActive: 1, category: 1 });
courseSchema.index({ isActive: 1, enrollmentCount: -1 });
courseSchema.index({ slug: 1, isActive: 1 });

module.exports = mongoose.model("Course", courseSchema);
