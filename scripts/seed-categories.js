/**
 * Seed script: replaces ALL categories with the 5 default ones.
 *
 *   node scripts/seed-categories.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Category = require("../models/Category");

const CATEGORIES = [
  {
    slug: "programming",
    title: { en: "Programming", ar: "البرمجة" },
    description: {
      en: "From colorful Scratch blocks to real Python code — your child learns to think, create, and build with a caring teacher by their side.",
      ar: "من مكعبات سكراتش الملونة إلى كود بايثون الحقيقي — طفلك يتعلم التفكير والإبداع والبناء بإرشاد معلم متمرّس.",
    },
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "robotics",
    title: { en: "Robotics", ar: "الروبوتات" },
    description: {
      en: "Little hands build real robots, connect sensors, and bring ideas to life — where curiosity meets engineering magic.",
      ar: "أيادٍ صغيرة تبني روبوتات حقيقية وتوصّل مستشعرات وتحوّل الأفكار إلى واقع — حيث يلتقي الفضول بسحر الهندسة.",
    },
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "algorithms",
    title: { en: "Algorithms", ar: "الخوارزميات" },
    description: {
      en: "Puzzles, patterns, and playful challenges that teach children to think like brilliant problem-solvers.",
      ar: "ألغاز وأنماط وتحديات ممتعة تعلّم الأطفال التفكير كحلّالين بارعين للمشكلات.",
    },
    sortOrder: 3,
    isActive: true,
  },
 
  {
    slug: "game-development",
    title: { en: "Game Development", ar: "تطوير الألعاب" },
    description: {
      en: "Design characters, build levels, and publish your own games — turning screen time into creative learning.",
      ar: "صمّم الشخصيات وابنِ المراحل وانشر ألعابك — حوّل وقت الشاشة إلى تعلّم إبداعي.",
    },
    sortOrder: 5,
    isActive: true,
  },
  {
    slug: "web-development",
    title: { en: "Web Development", ar: "تطوير الويب" },
    description: {
      en: "HTML, CSS, and JavaScript brought to life — kids build real websites they can proudly share with family and friends.",
      ar: "HTML وCSS وJavaScript تأخذ شكلها الحقيقي — يبني الأطفال مواقع حقيقية يفخرون بمشاركتها مع العائلة والأصدقاء.",
    },
    sortOrder: 6,
    isActive: true,
  },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const deleted = await Category.deleteMany({});
    console.log(`Removed ${deleted.deletedCount} old categories`);

    const created = await Category.insertMany(CATEGORIES);
    console.log(`Seeded ${created.length} categories:`);
    created.forEach((c) => console.log(`  ✔ ${c.slug} — ${c.title.en}`));

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

run();
