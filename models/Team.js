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
    color: { type: String, default: "from-blue-400 to-cyan-400" },
    linkedin: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
