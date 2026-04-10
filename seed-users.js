const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const Enrollment = require("./models/Enrollment");
const Note = require("./models/Note");

/**
 * Dev/demo only. Set SEED_DEMO_PASSWORD in .env (min 8 characters). Never commit real passwords.
 */
async function seedUsers() {
  try {
    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (!demoPassword || String(demoPassword).length < 8) {
      console.error(
        "Set SEED_DEMO_PASSWORD in .env (min 8 characters) before running seed:users."
      );
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clean old test data
    await User.deleteMany({ email: { $in: ["parent@test.com", "tutor@test.com"] } });
    await Enrollment.deleteMany({ email: "parent@test.com" });
    await Note.deleteMany({ parentEmail: "parent@test.com" });
    console.log("Cleared old test data");

    // ─── 1. Create Parent ───
    const parent = await User.create({
      name: "Sarah Ahmed",
      email: "parent@test.com",
      password: demoPassword,
      phone: "+966501234567",
      role: "parent",
      children: [
        { name: "Ali", age: 10, gender: "male", gradeLevel: "4-6", interests: ["programming", "robotics"] },
        { name: "Noor", age: 7, gender: "female", gradeLevel: "1-3", interests: ["arabic", "quran"] },
      ],
    });
    console.log(`Created parent: ${parent.email}`);

    // ─── 2. Create Instructor ───
    const instructor = await User.create({
      name: "Ahmed Noor",
      email: "tutor@test.com",
      password: demoPassword,
      phone: "+966509876543",
      role: "instructor",
      specialties: ["programming", "algorithms"],
      bio: "Senior software engineer with 6 years of teaching experience for kids.",
      assignedCourses: ["python", "scratch", "algo-intro"],
    });
    console.log(`Created instructor: ${instructor.email}`);

    // ─── 3. Create Enrollments ───
    const enrollment1 = await Enrollment.create({
      parentName: "Sarah Ahmed",
      email: "parent@test.com",
      phone: "+966501234567",
      relationship: "mother",
      childName: "Ali",
      childAge: 10,
      childGender: "male",
      gradeLevel: "4-6",
      schoolName: "International School Riyadh",
      courseId: "python",
      courseTitle: "Python for Kids",
      preferredDays: ["monday", "wednesday"],
      preferredTime: "afternoon",
      timezone: "AST",
      sessionFormat: "online_live",
      agreeTerms: true,
      status: "active",
      user: parent._id,
    });

    const enrollment2 = await Enrollment.create({
      parentName: "Sarah Ahmed",
      email: "parent@test.com",
      phone: "+966501234567",
      relationship: "mother",
      childName: "Ali",
      childAge: 10,
      gradeLevel: "4-6",
      courseId: "algo-intro",
      courseTitle: "Algorithm Adventures",
      preferredDays: ["tuesday", "thursday"],
      preferredTime: "morning",
      sessionFormat: "online_live",
      agreeTerms: true,
      status: "confirmed",
      user: parent._id,
    });

    const enrollment3 = await Enrollment.create({
      parentName: "Sarah Ahmed",
      email: "parent@test.com",
      phone: "+966501234567",
      relationship: "mother",
      childName: "Noor",
      childAge: 7,
      childGender: "female",
      gradeLevel: "1-3",
      courseId: "scratch",
      courseTitle: "Scratch Programming",
      preferredDays: ["saturday"],
      preferredTime: "morning",
      sessionFormat: "online_live",
      agreeTerms: true,
      status: "active",
      user: parent._id,
    });

    console.log(`Created ${3} enrollments`);

    // ─── 4. Create Instructor Notes ───
    await Note.insertMany([
      {
        instructor: instructor._id,
        instructorName: instructor.name,
        enrollment: enrollment1._id,
        courseId: "python",
        childName: "Ali",
        parentEmail: "parent@test.com",
        type: "progress",
        title: "Great progress on loops!",
        body: "Ali completed the loops chapter and scored 95% on the quiz. He's showing excellent logical thinking. I recommend he tries the bonus challenges this week.",
        readByParent: false,
      },
      {
        instructor: instructor._id,
        instructorName: instructor.name,
        enrollment: enrollment1._id,
        courseId: "python",
        childName: "Ali",
        parentEmail: "parent@test.com",
        type: "feedback",
        title: "Session recap — Functions intro",
        body: "We covered functions today. Ali understood the concept quickly but needs more practice with return values. I've assigned 3 practice exercises.",
        readByParent: false,
      },
      {
        instructor: instructor._id,
        instructorName: instructor.name,
        enrollment: enrollment3._id,
        courseId: "scratch",
        childName: "Noor",
        parentEmail: "parent@test.com",
        type: "achievement",
        title: "Noor earned the Animation Badge!",
        body: "Noor created her first animated story in Scratch today. She's very creative and loves adding sound effects. Keep encouraging her!",
        readByParent: false,
      },
      {
        instructor: instructor._id,
        instructorName: instructor.name,
        enrollment: enrollment2._id,
        courseId: "algo-intro",
        childName: "Ali",
        parentEmail: "parent@test.com",
        type: "absence",
        title: "Missed session — Tuesday",
        body: "Ali was absent from today's algorithm class. A makeup session has been scheduled for next Saturday at 10AM. Please confirm.",
        readByParent: false,
      },
    ]);
    console.log("Created 4 instructor notes");

    await mongoose.disconnect();
    console.log("\nSeed complete.\n");
    console.log("═══════════════════════════════════════");
    console.log("  PARENT LOGIN:    parent@test.com");
    console.log("  INSTRUCTOR LOGIN: tutor@test.com");
    console.log("  (password = value of SEED_DEMO_PASSWORD in .env)");
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedUsers();
