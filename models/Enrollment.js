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
    /** Optional disambiguator when two siblings share the same name (e.g. national ID, nickname). */
    childStudentId: { type: String, trim: true, default: "" },
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
    // Instructor-managed progress & scheduling
    lessonsDone: { type: Number, default: 0 },
    nextSession: { type: Date, default: null },
    badges: [{ name: { type: String, required: true }, awardedAt: { type: Date, default: Date.now } }],
    recordings: [
      {
        url: { type: String, required: true },
        title: { type: String, default: "" },
        sessionDate: { type: Date, default: Date.now },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    // Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
    },
    /** Admin-tracked payment progress (manual). */
    paymentStatus: {
      type: String,
      enum: ["none", "paid", "half", "deposit_15"],
      default: "none",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    /** Pricing snapshot at enrollment (list = catalog before course discount). */
    listPrice: { type: Number, default: null },
    currency: { type: String, default: null },
    courseDiscountPercent: { type: Number, default: null },
    priceAfterCourseDiscount: { type: Number, default: null },
    /** One-time first-enrollment discount for this parent email (after course discount, before promo). */
    firstTimeParentDiscountPercent: { type: Number, default: null },
    firstTimeParentDiscountAmount: { type: Number, default: null },
    priceAfterFirstTimeDiscount: { type: Number, default: null },
    promoCodeApplied: { type: String, default: null, uppercase: true, trim: true },
    promoDiscountAmount: { type: Number, default: null },
    amountDue: { type: Number, default: null },
  },
  { timestamps: true }
);

enrollmentSchema.pre("validate", function () {
  if (this.childStudentId == null || this.childStudentId === undefined) {
    this.childStudentId = "";
  }
});

// One non-cancelled enrollment per course + parent email + child identity
enrollmentSchema.index(
  { courseId: 1, email: 1, childName: 1, childStudentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "active", "completed"] },
    },
  }
);

enrollmentSchema.index({ email: 1, status: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ status: 1, createdAt: -1 });
enrollmentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
