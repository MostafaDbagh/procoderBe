const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Course = require("./models/Course");
const courses = require("./data/defaultCourses");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await Course.deleteMany({});
    console.log("Cleared existing courses");

    await Course.insertMany(courses);
    console.log(`Seeded ${courses.length} courses`);

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
