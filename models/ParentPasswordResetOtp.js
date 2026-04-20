const mongoose = require("mongoose");

/** One active OTP per parent email; TTL cleans up expired rows. */
const parentPasswordResetOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

parentPasswordResetOtpSchema.index({ email: 1 }, { unique: true });
parentPasswordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ParentPasswordResetOtp", parentPasswordResetOtpSchema);
