const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema(
  {
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    instructorName: { type: String, required: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
    courseId: { type: String, required: true },
    childName: { type: String, required: true },
    parentEmail: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["assigned", "submitted", "graded"],
      default: "assigned",
    },
    grade: { type: String, default: "" },
    feedback: { type: String, default: "" },
    readByParent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

homeworkSchema.index({ parentEmail: 1, createdAt: -1 });
homeworkSchema.index({ instructor: 1, createdAt: -1 });
homeworkSchema.index({ enrollment: 1 });

module.exports = mongoose.model("Homework", homeworkSchema);
