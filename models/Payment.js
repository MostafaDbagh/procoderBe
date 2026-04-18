const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    amountCents: { type: Number, required: true },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "USD",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
    },
    /** How the family should pay (admin-created payment requests). */
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "paypal"],
    },
    description: String,
    refundedCents: { type: Number, default: 0 },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ status: 1, currency: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
