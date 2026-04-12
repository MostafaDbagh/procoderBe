/** Seed rows for Category collection (slugs match legacy Course.category values). */
module.exports = [
  {
    slug: "programming",
    title: { en: "Programming", ar: "البرمجة" },
    description: {
      en: "Scratch to Python and web basics: logic, problem-solving, and real mini-projects with a live instructor.",
      ar: "من سكراتش إلى بايثون وأساسيات الويب: منطق، حل مسائل، ومشاريع صغيرة مع مدرس مباشر.",
    },
    sortOrder: 10,
  },
  {
    slug: "robotics",
    title: { en: "Robotics", ar: "الروبوتات" },
    description: {
      en: "Build and code robots with kits and guided lessons — sensors, motors, and beginner AI ideas.",
      ar: "تجميع وبرمجة روبوتات مع أدوات ودروس موجّهة — مستشعرات، محركات، ومفاهيم بسيطة للذكاء الاصطناعي.",
    },
    sortOrder: 20,
  },
  {
    slug: "algorithms",
    title: { en: "Algorithms", ar: "الخوارزميات" },
    description: {
      en: "Problem-solving and contest-style thinking: sorting, search, and patterns — taught through puzzles and games.",
      ar: "تفكير حاسوبي وأسلوب مسابقات: فرز، بحث، وأنماط — عبر ألغاز وألعاب.",
    },
    sortOrder: 30,
  },
  {
    slug: "arabic",
    title: { en: "Arabic Language", ar: "اللغة العربية" },
    description: {
      en: "Reading, writing, and grammar with native teachers — structured levels from letters to composition.",
      ar: "قراءة وكتابة وقواعد مع مدرسين عرب — مستويات من الحروف إلى التعبير.",
    },
    sortOrder: 40,
  },
  {
    slug: "quran",
    title: { en: "Quran Studies", ar: "القرآن الكريم" },
    description: {
      en: "Tajweed and recitation, plus structured memorization (Hifz) in small live groups or one-to-one.",
      ar: "تجويد وتلاوة، وحفظ منظم في مجموعات صغيرة أو حصص فردية.",
    },
    sortOrder: 50,
  },
];
