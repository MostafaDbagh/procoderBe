const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    role: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    avatar: { type: String, required: true, maxlength: 2 },
    /** Image URL: local `/uploads/...` or Cloudinary `https://res.cloudinary.com/...`. */
    photoUrl: { type: String, default: "" },
    /** Cloudinary public_id (folder `teams/...`); used to delete/replace the asset. */
    photoPublicId: { type: String, default: "" },
    color: { type: String, default: "from-blue-400 to-cyan-400" },
    /** Top strip on home “Meet Our Stars” card (Tailwind bg-*). */
    headerColor: { type: String, default: "bg-primary" },
    linkedin: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    experienceYears: { type: Number, default: 0, min: 0 },
    skillsEn: { type: [String], default: [] },
    skillsAr: { type: [String], default: [] },
    locationEn: { type: String, default: "" },
    locationAr: { type: String, default: "" },
    flag: { type: String, default: "", maxlength: 16 },
    bio: {
      en: { type: String, default: "" },
      ar: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

teamSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("Team", teamSchema);
