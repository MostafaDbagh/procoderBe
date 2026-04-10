const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // Who wrote it
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    instructorName: { type: String, required: true },
    // Which enrollment/student it's about
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
    courseId: { type: String, required: true },
    // Student info (denormalized for quick reads)
    childName: { type: String, required: true },
    parentEmail: { type: String, required: true },
    // Note content
    type: {
      type: String,
      enum: ["progress", "feedback", "absence", "achievement", "general"],
      default: "general",
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    // Has the parent seen it?
    readByParent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

noteSchema.index({ parentEmail: 1, createdAt: -1 });
noteSchema.index({ instructor: 1, createdAt: -1 });
noteSchema.index({ enrollment: 1 });

module.exports = mongoose.model("Note", noteSchema);
