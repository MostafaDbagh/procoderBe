const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    /** Login handle for admin panel (optional; unique when set). */
    username: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["parent", "student", "instructor", "admin"], default: "parent" },
    // Instructor-specific fields
    specialties: [String],        // e.g. ["programming", "robotics"]
    bio: { type: String },
    assignedCourses: [String],    // course slugs this instructor teaches
    phone: { type: String },
    children: [
      {
        name: String,
        age: Number,
        gender: String,
        gradeLevel: String,
        interests: [String],
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
