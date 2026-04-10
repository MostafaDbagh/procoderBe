const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    // Parent info
    parentName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true },
    // Child info
    childName: { type: String, required: true },
    childAge: { type: Number, required: true },
    childGender: String,
    gradeLevel: { type: String, required: true },
    schoolName: String,
    previousExperience: String,
    // Schedule
    courseId: { type: String, required: true },
    courseTitle: String,
    preferredDays: [String],
    preferredTime: String,
    timezone: String,
    sessionFormat: { type: String, required: true },
    startDate: String,
    // Additional
    learningGoals: String,
    specialNeeds: String,
    howDidYouHear: String,
    agreeTerms: { type: Boolean, required: true },
    agreePhotos: Boolean,
    // Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
