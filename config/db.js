const mongoose = require("mongoose");
const ensureDefaultCategories = require("../services/ensureDefaultCategories");
const ensureDefaultCourses = require("../services/ensureDefaultCourses");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await ensureDefaultCategories();
    await ensureDefaultCourses();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
