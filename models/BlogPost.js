const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    excerpt: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    body: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    coverImage: { type: String, default: "" },
    coverImagePublicId: { type: String, default: "" },
    category: {
      type: String,
      enum: ["coding", "robotics", "arabic", "parenting", "stem", "general"],
      default: "general",
    },
    tags: [String],
    // SEO
    metaTitle: { en: String, ar: String },
    metaDescription: { en: String, ar: String },
    // Target regions for geo SEO
    targetRegions: [String],
    // Author
    author: {
      name: { type: String, required: true },
      avatar: String,
      role: String,
    },
    // Status
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    // Engagement
    viewCount: { type: Number, default: 0 },
    readTimeMinutes: { type: Number, default: 5 },
    // Related courses
    relatedCourses: [String], // course slugs
  },
  { timestamps: true }
);

blogPostSchema.index({ isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ tags: 1 });

module.exports = mongoose.model("BlogPost", blogPostSchema);
