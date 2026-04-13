const mongoose = require("mongoose");
require("dotenv").config();
const BlogPost = require("./models/BlogPost");

const posts = [
  {
    slug: "best-coding-classes-kids-dubai",
    title: {
      en: "Best Coding Classes for Kids in Dubai 2026",
      ar: "أفضل دورات البرمجة للأطفال في دبي ٢٠٢٦",
    },
    excerpt: {
      en: "Discover the top online and in-person coding classes for children ages 6–18 in Dubai. From Scratch to Python, find the perfect program.",
      ar: "اكتشف أفضل دورات البرمجة عبر الإنترنت والحضورية للأطفال من ٦ إلى ١٨ سنة في دبي.",
    },
    body: {
      en: `## Why Coding for Kids in Dubai?\n\nDubai has become a global hub for technology and innovation. Teaching your child to code gives them a competitive advantage in the UAE's fast-growing tech economy.\n\n## Top 5 Coding Programs\n\n### 1. ProCoder — Live Online Classes\nProCoder offers live, small-group coding classes with certified instructors. Children learn Scratch (ages 6–9), Python (ages 10–13), and Web Development (ages 14–18). Classes are available in English and Arabic.\n\n**Why choose ProCoder:**\n- 8:1 max student-teacher ratio\n- Certified, background-checked instructors\n- Free trial class available\n- Flexible scheduling across all UAE timezones\n\n### 2. Starting Early with Scratch\nScratch is the perfect entry point for young coders. Kids aged 6–9 learn computational thinking through colorful visual blocks, creating games and animations.\n\n### 3. Python — The Next Step\nFor kids aged 10–13, Python introduces real programming syntax. Students build games, automate tasks, and learn one of the world's most popular languages.\n\n### 4. Web Development for Teens\nTeenagers learn HTML, CSS, and JavaScript to build real websites. This course prepares them for future careers in tech.\n\n### 5. Game Development\nKids aged 12–16 learn to design and build 2D games. They create characters, levels, and even publish their own games.\n\n## How to Choose the Right Class\n\nConsider your child's age, experience level, and interests. ProCoder's AI-powered recommendation tool can help you find the perfect match.\n\n## Get Started\n\nBook a free trial class at ProCoder today and give your child the gift of coding.`,
      ar: `## لماذا البرمجة للأطفال في دبي؟\n\nأصبحت دبي مركزاً عالمياً للتكنولوجيا والابتكار. تعليم طفلك البرمجة يمنحه ميزة تنافسية في اقتصاد الإمارات التقني المتنامي.\n\n## أفضل ٥ برامج برمجة\n\n### ١. بروكودر — فصول مباشرة أونلاين\nيقدم بروكودر فصول برمجة مباشرة في مجموعات صغيرة مع مدرسين معتمدين. يتعلم الأطفال سكراتش (٦–٩) وبايثون (١٠–١٣) وتطوير الويب (١٤–١٨).\n\n## كيف تختار الدورة المناسبة\n\nاستخدم أداة التوصية الذكية في بروكودر لإيجاد الدورة المثالية لطفلك.\n\n## ابدأ الآن\n\nاحجز حصة تجريبية مجانية في بروكودر اليوم.`,
    },
    category: "coding",
    tags: ["dubai", "uae", "coding", "kids", "programming", "scratch", "python"],
    targetRegions: ["UAE", "Dubai", "Abu Dhabi"],
    metaTitle: { en: "Best Coding Classes for Kids in Dubai 2026 | ProCoder", ar: "أفضل دورات البرمجة للأطفال في دبي ٢٠٢٦" },
    metaDescription: { en: "Find the best online coding classes for kids in Dubai. Scratch, Python, Web Dev for ages 6–18. Free trial available.", ar: "أفضل دورات البرمجة أونلاين للأطفال في دبي. سكراتش وبايثون وتطوير الويب." },
    author: { name: "ProCoder Team", role: "Education Team" },
    relatedCourses: ["scratch", "python", "webdev"],
    isPublished: true,
    publishedAt: new Date("2026-04-01"),
  },
  {
    slug: "how-to-teach-quran-children-online",
    title: {
      en: "How to Teach Quran to Children Online — A Parent's Guide",
      ar: "كيف تعلّم طفلك القرآن أونلاين — دليل الوالدين",
    },
    excerpt: {
      en: "A comprehensive guide for parents on teaching Quran recitation and memorization to children through online platforms.",
      ar: "دليل شامل للوالدين حول تعليم تلاوة وحفظ القرآن للأطفال عبر المنصات الإلكترونية.",
    },
    body: {
      en: `## The Importance of Early Quran Education\n\nTeaching children the Quran from a young age builds a strong spiritual foundation. With technology, this is now possible from anywhere in the world.\n\n## Online vs Traditional Quran Classes\n\n### Online Advantages\n- Flexible scheduling\n- One-on-one attention\n- Certified teachers from around the Muslim world\n- Session recordings for practice\n- Safe, monitored environment\n\n## What to Look for in an Online Quran Program\n\n1. **Certified Teachers** — Look for teachers with Ijazah\n2. **Small Groups** — No more than 4-8 students\n3. **Tajweed Focus** — Proper pronunciation rules\n4. **Progress Tracking** — Regular reports for parents\n5. **Safety** — Background-checked teachers, COPPA compliance\n\n## ProCoder's Quran Programs\n\n### Quran Recitation (Ages 6–12)\nFocuses on Tajweed rules, proper pronunciation, and beautiful recitation with certified teachers.\n\n### Quran Memorization (Ages 10–18)\nA structured Hifz program with proven techniques for memorization and retention.\n\n## Tips for Parents\n\n- Set a daily routine\n- Listen with your child\n- Celebrate milestones\n- Be patient and encouraging\n\n## Start Today\n\nBook a free trial at ProCoder and see how our qualified teachers make Quran learning engaging for your child.`,
      ar: `## أهمية تعليم القرآن المبكر\n\nتعليم الأطفال القرآن من سن مبكر يبني أساساً روحياً قوياً. بفضل التكنولوجيا أصبح هذا ممكناً من أي مكان في العالم.\n\n## برامج القرآن في بروكودر\n\n### تلاوة القرآن (٦–١٢)\nيركز على أحكام التجويد والنطق الصحيح مع معلمين معتمدين.\n\n### حفظ القرآن (١٠–١٨)\nبرنامج حفظ منظم بتقنيات مثبتة.\n\n## نصائح للوالدين\n\n- ضع روتين يومي\n- استمع مع طفلك\n- احتفل بالإنجازات\n\n## ابدأ اليوم\n\nاحجز حصة تجريبية مجانية في بروكودر.`,
    },
    category: "quran",
    tags: ["quran", "tajweed", "hifz", "online-learning", "children", "islamic-education"],
    targetRegions: ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Global"],
    metaTitle: { en: "How to Teach Quran to Children Online | ProCoder", ar: "تعليم القرآن للأطفال أونلاين" },
    metaDescription: { en: "Parent's guide to teaching Quran online. Tajweed, Hifz programs for kids. Certified teachers, free trial.", ar: "دليل تعليم القرآن أونلاين للأطفال. تجويد وحفظ مع معلمين معتمدين." },
    author: { name: "ProCoder Team", role: "Education Team" },
    relatedCourses: ["quran-recitation", "quran-memorization"],
    isPublished: true,
    publishedAt: new Date("2026-03-15"),
  },
  {
    slug: "robotics-for-kids-saudi-arabia",
    title: {
      en: "Robotics for Kids in Saudi Arabia — Building Future Engineers",
      ar: "الروبوتات للأطفال في السعودية — بناء مهندسي المستقبل",
    },
    excerpt: {
      en: "How robotics education is shaping the next generation of Saudi engineers. Programs, competitions, and online classes for kids.",
      ar: "كيف يشكّل تعليم الروبوتات الجيل القادم من المهندسين السعوديين.",
    },
    body: {
      en: `## Saudi Vision 2030 and STEM Education\n\nSaudi Arabia's Vision 2030 places strong emphasis on technology and innovation. Robotics education for children is a key part of this transformation.\n\n## Why Robotics for Kids?\n\n- Develops problem-solving skills\n- Teaches engineering thinking\n- Prepares for future careers in AI and automation\n- Builds confidence through hands-on projects\n\n## ProCoder's Robotics Programs\n\n### Robot Builders (Ages 8–12)\nKids assemble real robots, learn about sensors and motors, and program them using visual tools. Kits are shipped directly to your home.\n\n### Advanced Robotics (Ages 13–18)\nAdvanced students work with sophisticated sensors, learn autonomous navigation, and prepare for international competitions like FLL and FIRST.\n\n## Robotics Competitions in Saudi Arabia\n\nSaudi Arabia hosts several robotics competitions for children, including the Saudi Robotics Championship and regional FIRST LEGO League events.\n\n## Getting Started\n\nNo prior experience needed. ProCoder's beginner robotics course is perfect for kids who have never touched a robot before.\n\nBook a free trial today and watch your child's engineering journey begin.`,
      ar: `## رؤية ٢٠٣٠ وتعليم العلوم\n\nتضع رؤية السعودية ٢٠٣٠ تركيزاً قوياً على التكنولوجيا والابتكار. تعليم الروبوتات للأطفال جزء أساسي من هذا التحول.\n\n## برامج الروبوتات في بروكودر\n\n### بناة الروبوتات (٨–١٢)\nيجمّع الأطفال روبوتات حقيقية ويبرمجونها.\n\n### روبوتات متقدمة (١٣–١٨)\nتحضير للمسابقات الدولية مثل FLL وFIRST.\n\n## ابدأ اليوم\n\nلا حاجة لخبرة سابقة. احجز حصة تجريبية مجانية.`,
    },
    category: "robotics",
    tags: ["robotics", "saudi-arabia", "vision-2030", "stem", "engineering", "kids"],
    targetRegions: ["Saudi Arabia", "Riyadh", "Jeddah", "Dammam"],
    metaTitle: { en: "Robotics for Kids in Saudi Arabia | ProCoder", ar: "الروبوتات للأطفال في السعودية" },
    metaDescription: { en: "Robotics classes for kids in Saudi Arabia. Build real robots, prepare for competitions. Vision 2030 aligned.", ar: "دورات روبوتات للأطفال في السعودية. ابنِ روبوتات حقيقية." },
    author: { name: "ProCoder Team", role: "Education Team" },
    relatedCourses: ["robot-basics", "robot-advanced"],
    isPublished: true,
    publishedAt: new Date("2026-03-20"),
  },
  {
    slug: "arabic-language-learning-kids-europe",
    title: {
      en: "Teaching Arabic to Kids in Europe — Keep the Language Alive",
      ar: "تعليم العربية للأطفال في أوروبا — حافظ على اللغة",
    },
    excerpt: {
      en: "For Arabic-speaking families in Europe: how to maintain your children's Arabic language skills with online classes.",
      ar: "للعائلات العربية في أوروبا: كيف تحافظ على مهارات أطفالك في اللغة العربية.",
    },
    body: {
      en: `## The Challenge for Arabic Families Abroad\n\nMany Arab families in Germany, France, UK, Netherlands, and Sweden struggle to keep their children fluent in Arabic. School systems focus on European languages, and children naturally gravitate toward the dominant language.\n\n## Online Arabic Classes — The Solution\n\nOnline platforms like ProCoder offer structured Arabic classes that fit around your family's European schedule.\n\n### Arabic Reading & Writing (Ages 6–9)\nLetters, vocabulary, basic sentences, and beautiful handwriting. Native Arabic teachers make it fun and engaging.\n\n### Arabic Grammar (Ages 10–14)\nGrammar rules, verb conjugation, composition, and reading comprehension through stories and exercises.\n\n## Tips for Families in Europe\n\n1. Speak Arabic at home\n2. Watch Arabic cartoons together\n3. Read Arabic books before bed\n4. Enroll in structured online classes\n5. Connect with Arabic-speaking community groups\n\n## ProCoder — Arabic & More\n\nBeyond Arabic, ProCoder also offers Quran classes, coding, and robotics — all in Arabic or English. Perfect for bilingual families who want the best of both worlds.\n\nBook a free trial today.`,
      ar: `## التحدي للعائلات العربية في الخارج\n\nتعاني كثير من العائلات العربية في ألمانيا وفرنسا وبريطانيا من الحفاظ على طلاقة أطفالهم بالعربية.\n\n## دورات العربية أونلاين — الحل\n\n### القراءة والكتابة (٦–٩)\nالحروف والمفردات والجمل الأساسية مع معلمين عرب أصليين.\n\n### القواعد (١٠–١٤)\nقواعد النحو وتصريف الأفعال والتعبير.\n\n## نصائح للعائلات في أوروبا\n\n- تحدثوا العربية في البيت\n- شاهدوا رسوم متحركة عربية\n- اقرأوا كتب عربية قبل النوم\n\n## احجز حصة تجريبية مجانية اليوم.`,
    },
    category: "arabic",
    tags: ["arabic", "europe", "diaspora", "language-learning", "kids", "bilingual"],
    targetRegions: ["Germany", "France", "UK", "Netherlands", "Sweden", "Europe"],
    metaTitle: { en: "Arabic Classes for Kids in Europe | ProCoder", ar: "دورات عربية للأطفال في أوروبا" },
    metaDescription: { en: "Online Arabic classes for kids in Europe. Keep your children's Arabic alive. Native teachers, flexible schedule.", ar: "دورات عربية أونلاين للأطفال في أوروبا." },
    author: { name: "ProCoder Team", role: "Education Team" },
    relatedCourses: ["arabic-reading", "arabic-grammar"],
    isPublished: true,
    publishedAt: new Date("2026-04-05"),
  },
  {
    slug: "stem-education-gcc-parents-guide",
    title: {
      en: "STEM Education in the GCC — A Parent's Complete Guide",
      ar: "تعليم العلوم والتكنولوجيا في الخليج — دليل الوالدين الشامل",
    },
    excerpt: {
      en: "Everything parents in Saudi Arabia, UAE, Qatar, Kuwait, Oman, and Bahrain need to know about STEM education for their children.",
      ar: "كل ما يحتاج الوالدون في السعودية والإمارات وقطر والكويت وعمان والبحرين لمعرفته عن تعليم العلوم لأطفالهم.",
    },
    body: {
      en: `## What is STEM?\n\nSTEM stands for Science, Technology, Engineering, and Mathematics. It's the foundation of the modern economy and critical for children growing up in the GCC.\n\n## Why STEM Matters in the GCC\n\n- Economic diversification (Vision 2030, Vision 2021)\n- Growing tech sector\n- High-paying career opportunities\n- Innovation and entrepreneurship culture\n\n## STEM Programs by Age\n\n### Ages 6–9: Foundation\n- Scratch programming\n- Basic robotics\n- Math puzzles and logic games\n\n### Ages 10–13: Exploration\n- Python programming\n- Algorithm adventures\n- Robot building with sensors\n\n### Ages 14–18: Specialization\n- Web development\n- Competitive programming\n- Advanced robotics and AI\n- Game development\n\n## ProCoder — Your STEM Partner\n\nProCoder offers all these programs with live, certified instructors. Small groups (max 8 students), flexible scheduling, and bilingual support.\n\n## Free Trial\n\nBook a free trial class and find the right STEM path for your child.`,
      ar: `## ما هو STEM؟\n\nSTEM يعني العلوم والتكنولوجيا والهندسة والرياضيات. إنه أساس الاقتصاد الحديث.\n\n## لماذا STEM مهم في الخليج؟\n\n- التنويع الاقتصادي (رؤية ٢٠٣٠)\n- قطاع التكنولوجيا المتنامي\n- فرص وظيفية عالية الأجر\n\n## بروكودر — شريكك في STEM\n\nيقدم بروكودر جميع هذه البرامج مع مدرسين معتمدين. احجز حصة تجريبية مجانية.`,
    },
    category: "stem",
    tags: ["stem", "gcc", "saudi-arabia", "uae", "qatar", "kuwait", "oman", "bahrain", "education"],
    targetRegions: ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman", "Bahrain", "GCC"],
    metaTitle: { en: "STEM Education in the GCC — Parent's Guide | ProCoder", ar: "تعليم STEM في الخليج — دليل الوالدين" },
    metaDescription: { en: "Complete guide to STEM education for kids in Saudi Arabia, UAE, Qatar, Kuwait. Programs by age, free trial.", ar: "دليل تعليم العلوم للأطفال في الخليج." },
    author: { name: "ProCoder Team", role: "Education Team" },
    relatedCourses: ["scratch", "python", "robot-basics", "algo-intro"],
    isPublished: true,
    publishedAt: new Date("2026-04-10"),
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    await BlogPost.deleteMany({});
    console.log("Cleared existing blog posts");
    await BlogPost.insertMany(posts);
    console.log(`Seeded ${posts.length} blog posts`);
    for (const p of posts) {
      console.log(`  ✓ ${p.slug} (${p.category})`);
    }
    await mongoose.disconnect();
    console.log("\nDone!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
