/** Seed rows for Category collection (slugs match legacy Course.category values). */
module.exports = [
 {
 slug: "programming",
 title: { en: "Programming", ar: "البرمجة" },
 description: {
 en: "From colorful Scratch blocks to real Python code — your child learns to think, create, and build with a caring teacher by their side.",
 ar: "من كتل سكراتش الملوّنة إلى كود بايثون الحقيقي — يتعلم طفلك التفكير والإبداع والبناء مع معلم يرافقه بعناية.",
 },
 sortOrder: 10,
 },
 {
 slug: "robotics",
 title: { en: "Robotics", ar: "الروبوتات" },
 description: {
 en: "Little hands build real robots, connect sensors, and bring ideas to life — where curiosity meets engineering magic.",
 ar: "أيدٍ صغيرة تبني روبوتات حقيقية وتوصل مستشعرات وتُحيي الأفكار — حيث يلتقي الفضول بسحر الهندسة.",
 },
 sortOrder: 20,
 },
 {
 slug: "algorithms",
 title: { en: "Algorithms", ar: "الخوارزميات" },
 description: {
 en: "Puzzles, patterns, and playful challenges that teach children to think like brilliant problem-solvers.",
 ar: "ألغاز وأنماط وتحديات ممتعة تعلّم الأطفال التفكير كمحترفين في حل المشكلات.",
 },
 sortOrder: 30,
 },

 {
 slug: "arabic",
 title: { en: "Arabic Studies", ar: "اللغة العربية" },
 description: {
 en: "The beauty of reading fluency and the blessing of writing mastery — in small, gentle groups where every child's voice is treasured.",
 ar: "جمال التعبير وبركة الحفظ — في مجموعات صغيرة ولطيفة حيث صوت كل طفل ثمين.",
 },
 sortOrder: 50,
 },
];
