/** Seed rows for Category collection (slugs match legacy Course.category values). */
module.exports = [
  {
    slug: "programming",
    title: { en: "Programming", ar: "البرمجة" },
    sortOrder: 10,
  },
  {
    slug: "robotics",
    title: { en: "Robotics", ar: "الروبوتات" },
    sortOrder: 20,
  },
  {
    slug: "algorithms",
    title: { en: "Algorithms", ar: "الخوارزميات" },
    sortOrder: 30,
  },
  {
    slug: "arabic",
    title: { en: "Arabic Language", ar: "اللغة العربية" },
    sortOrder: 40,
  },
  {
    slug: "quran",
    title: { en: "Quran Studies", ar: "القرآن الكريم" },
    sortOrder: 50,
  },
];
