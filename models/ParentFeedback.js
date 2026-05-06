const mongoose = require("mongoose");

const parentFeedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parentName: { type: String, required: true, trim: true },
    parentEmail: { type: String, required: true, trim: true, lowercase: true },
    parentPhone: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["note", "enhancement", "complaint", "feature", "other"],
      default: "note",
    },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new",
    },
    adminNote: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

parentFeedbackSchema.index({ status: 1, createdAt: -1 });
parentFeedbackSchema.index({ parentEmail: 1, createdAt: -1 });
parentFeedbackSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("ParentFeedback", parentFeedbackSchema);
