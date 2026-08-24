const mongoose = require("mongoose");

/**
 * A structured request from a learning-journey level page (/learning-path/<level>):
 *  - "registration"  → "Register for Explorer" join request (parent + child details)
 *  - "call_request"  → "Request a short call with the team"
 *
 * Both carry the parent's fit-check answers (all 9 questions, with the question
 * text and the chosen option label in the locale the parent used) plus the
 * rule-engine outcome, so the team sees the full picture in the admin panel.
 */
const answerSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    question: { type: String, trim: true },
    value: { type: String, trim: true },
    label: { type: String, trim: true },
  },
  { _id: false }
);

const explorerRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["registration", "call_request"],
      required: true,
    },
    locale: { type: String, enum: ["en", "ar"], default: "en" },

    /** Which of the five STL levels the parent applied from. */
    level: {
      type: String,
      enum: ["explorer", "builder", "creator", "innovator", "pro"],
      default: "explorer",
      lowercase: true,
      trim: true,
    },

    // Parent
    parentName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 30 },

    // Child (registration)
    childName: { type: String, trim: true, maxlength: 100 },
    childAge: { type: String, trim: true, maxlength: 10 },
    childLanguage: { type: String, enum: ["ar", "en", "both", ""], default: "" },

    // Follow-up preferences
    preferredMethod: { type: String, enum: ["whatsapp", "call", "email", ""], default: "" },
    preferredTime: { type: String, enum: ["morning", "afternoon", "evening", ""], default: "" },

    note: { type: String, trim: true, maxlength: 2000 },

    // Fit check
    // Level-agnostic outcome codes. The EXPLORER_* values are retained so
    // requests captured before the five-level rollout still validate.
    fitOutcome: {
      type: String,
      enum: [
        "LIKELY_FIT",
        "WITH_REVIEW",
        "CHECK_OTHER_STAGE",
        "PRE_START_REVIEW",
        "EXPLORER_LIKELY_FIT",
        "EXPLORER_WITH_REVIEW",
        "CHECK_HIGHER_STAGE",
        "",
      ],
      default: "",
    },
    answers: { type: [answerSchema], default: [] },

    consent: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

explorerRequestSchema.index({ createdAt: -1 });
explorerRequestSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model("ExplorerRequest", explorerRequestSchema);
