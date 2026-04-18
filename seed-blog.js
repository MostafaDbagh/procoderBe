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
 en: "A parent's guide to finding the right coding class for your child in Dubai — where learning meets joy, creativity, and confidence.",
 ar: "دليل الوالدين لإيجاد دورة البرمجة المناسبة لطفلك في دبي — حيث يلتقي التعلم بالفرح والإبداع والثقة.",
 },
 body: {
 en: `## Why Coding Is a Gift for Your Child\n\nAs a parent in Dubai, you want the very best for your child. Teaching them to code isn't just about technology — it's about giving them the confidence to create, the patience to solve problems, and the joy of seeing their ideas come to life.\n\n## Finding the Right Path for Your Child\n\n### Starting with Scratch (Ages 6–9)\nFor little ones, Scratch is a magical first step. Using colorful blocks, children create their own games and animations — learning to think creatively while having the time of their lives.\n\n### Growing with Python (Ages 10–13)\nWhen your child is ready for more, Python opens a world of real coding. They'll build fun games and projects, discovering that they can bring their own ideas to life, one line at a time.\n\n### Web Development for Teens (Ages 14–18)\nTeenagers learn to build their own corner of the internet — personal pages, blogs, and interactive sites that they can proudly share with friends.\n\n### Game Development (Ages 12–16)\nFor children who dream of making games, this course turns imagination into reality. They design characters, build levels, and create something they can share with the world.\n\n## What Makes StemTechLab Different\n\n- **Small, caring classes** — no more than 8 children per teacher\n- **Trusted, background-checked teachers** who genuinely love working with kids\n- **A free trial class** so your child can experience it before you decide\n- **Flexible scheduling** that works around your family's life\n- **Bilingual support** in English and Arabic\n\n## How to Choose\n\nThink about what makes your child's eyes light up. Are they a storyteller? A builder? A puzzle-lover? Our course finder can help you discover the perfect fit.\n\n## Take the First Step\n\nBook a free trial class and watch your child discover something wonderful about themselves.`,
 ar: `## لماذا البرمجة هدية لطفلك\n\nكوالد في دبي، تريد الأفضل لطفلك. تعليمه البرمجة ليس فقط عن التكنولوجيا — بل عن منحه الثقة للإبداع والصبر لحل المشكلات وفرحة رؤية أفكاره تتحول لحقيقة.\n\n## إيجاد المسار المناسب لطفلك\n\n### البداية مع سكراتش (٦–٩)\nللصغار، سكراتش خطوة أولى سحرية باستخدام كتل ملوّنة.\n\n### النمو مع بايثون (١٠–١٣)\nعندما يكون طفلك جاهزاً للمزيد، بايثون يفتح عالم البرمجة الحقيقية.\n\n## ما يميز ستم تك لاب\n\n- فصول صغيرة ومحبّة — لا أكثر من ٨ أطفال لكل معلم\n- معلمون موثوقون يحبون العمل مع الأطفال حقاً\n- حصة تجريبية مجانية\n\n## اتخذ الخطوة الأولى\n\nاحجز حصة تجريبية مجانية وشاهد طفلك يكتشف شيئاً رائعاً عن نفسه.`,
 },
 category: "coding",
 tags: ["dubai", "uae", "coding", "kids", "programming", "scratch", "python"],
 targetRegions: ["UAE", "Dubai", "Abu Dhabi"],
 metaTitle: { en: "Best Coding Classes for Kids in Dubai 2026 | StemTechLab", ar: "أفضل دورات البرمجة للأطفال في دبي ٢٠٢٦" },
 metaDescription: { en: "A parent's guide to the best coding classes for kids in Dubai. Scratch, Python, Web Dev for ages 6–18 in a warm, caring environment.", ar: "دليل الوالدين لأفضل دورات البرمجة للأطفال في دبي. بيئة دافئة ومحبّة." },
 author: { name: "StemTechLab Team", role: "Education Team" },
 relatedCourses: ["scratch", "python", "webdev"],
 isPublished: true,
 publishedAt: new Date("2026-04-01"),
 },
 {
 slug: "how-to-teach-arabic-children-online",
 title: {
 en: "How to Teach Arabic to Children Online — A Parent's Guide",
 ar: "كيف تعلّم طفلك العربية أونلاين — دليل الوالدين",
 },
 excerpt: {
 en: "A heartfelt guide for parents who want to nurture their child's connection with the Arabic through gentle, caring online classes.",
 ar: "دليل من القلب للوالدين الذين يريدون تنمية علاقة طفلهم بالعربية من خلال دروس لطيفة ومحبّة عبر الإنترنت.",
 },
 body: {
 en: `## A Beautiful Gift That Lasts a Lifetime\n\nTeaching your child the Arabic is one of the most precious gifts you can give them. It builds a spiritual foundation that will comfort, guide, and strengthen them throughout their entire life. And with caring online teachers, this blessing is now possible from anywhere in the world.\n\n## What to Look for in a Arabic Program for Your Child\n\nAs a parent, you want someone who will treat your child with the same gentleness and patience you would. Here's what matters most:\n\n- **A teacher who truly cares** — with proper Ijazah and a love for children\n- **Small, intimate groups** — so your child is never lost in the crowd\n- **Beautiful reading fluency focus** — learning proper pronunciation from the start\n- **Progress you can see** — regular updates so you can celebrate together\n- **A safe, warm environment** — background-checked teachers you can trust\n\n## StemTechLab's Arabic Programs\n\n### Arabic Reading (Ages 6–12)\nWith warmth and patience, caring teachers guide your child to recite beautifully — nurturing a love for every verse and the confidence to recite with proper reading fluency.\n\n### Arabic Writing (Ages 10–18)\nA blessed journey of writing mastery with proven techniques, loving support, and a dedicated teacher who walks beside your child every step of the way.\n\n## Tips for Parents\n\n- **Make it a daily moment together** — even 10 minutes of listening builds a habit\n- **Sit with your child** — your presence means more than you know\n- **Celebrate every milestone** — every new surah is a beautiful achievement\n- **Be patient and gentle** — the journey matters as much as the destination\n- **Let them hear you recite** — children learn so much by example\n\n## Take the First Step\n\nBook a free trial class and see how our loving teachers make the Arabic feel like home for your child.`,
 ar: `## هدية جميلة تدوم مدى الحياة\n\nتعليم طفلك العربية من أثمن الهدايا التي يمكنك تقديمها. يبني أساساً روحياً يريحهم ويرشدهم ويقويهم طوال حياتهم.\n\n## برامج العربية في ستم تك لاب\n\n### قراءة العربية (٦–١٢)\nبدفء وصبر، يرشد معلمون محبّون طفلك لقراءة العربية بجمال.\n\n### حفظ العربية (١٠–١٨)\nرحلة مباركة في الحفظ مع دعم محبّ ومعلم مخلص.\n\n## نصائح للوالدين\n\n- اجعلها لحظة يومية معاً\n- اجلس مع طفلك — حضورك يعني الكثير\n- احتفل بكل إنجاز\n- كن صبوراً ولطيفاً\n\n## اتخذ الخطوة الأولى\n\nاحجز حصة تجريبية مجانية وشاهد كيف يجعل معلمونا المحبّون العربية يشعر كالبيت لطفلك.`,
 },
 category: "arabic",
 tags: ["arabic", "arabic expression", "arabic writing", "online-learning", "children", "arabic-education"],
 targetRegions: ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Global"],
 metaTitle: { en: "How to Teach Arabic to Children Online | StemTechLab", ar: "تعليم العربية للأطفال أونلاين" },
 metaDescription: { en: "A heartfelt parent's guide to online Arabic learning. reading fluency, writing mastery with caring, certified teachers your child will love.", ar: "دليل محبّ لتعليم العربية أونلاين للأطفال. تعبير وحفظ مع معلمين يحبهم طفلك." },
 author: { name: "StemTechLab Team", role: "Education Team" },
 relatedCourses: ["arabic-recitation", "arabic-memorization"],
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
 en: "Watch your child's eyes light up as they build their first robot — and discover the engineer, the thinker, and the dreamer inside them.",
 ar: "شاهد عيني طفلك تتألق وهو يبني أول روبوت — واكتشف المهندس والمفكر والحالم بداخله.",
 },
 body: {
 en: `## The Joy of Building Something Real\n\nThere's a moment every parent remembers — when your child builds something with their own hands and says, "I made this!" Robotics gives children that moment again and again. It teaches them to think, to try, to fix what's broken, and to believe in what they can create.\n\n## What Robotics Teaches Your Child\n\n- **Patience and persistence** — building takes time, and every mistake is a lesson\n- **How to think like an engineer** — breaking big problems into small, friendly steps\n- **Confidence** — there's nothing like watching something you built come to life\n- **Teamwork and creativity** — working together to solve exciting challenges\n\n## StemTechLab's Robotics Programs\n\n### Robot Builders (Ages 8–12)\nLittle hands build real robots! Your child assembles parts, connects sensors, and watches their creation come to life. We ship the robotics kit right to your door.\n\n### Advanced Robotics (Ages 13–18)\nFor young engineers ready for more — designing smart robots that navigate, sense, and even think on their own. Includes preparation for exciting competitions.\n\n## No Experience Needed\n\nEvery expert was once a beginner. Our robotics course is designed for children who have never touched a robot before — and by the end, they'll have built one they're proud of.\n\n## Take the First Step\n\nBook a free trial class and watch the spark of engineering light up in your child.`,
 ar: `## فرحة بناء شيء حقيقي\n\nهناك لحظة يتذكرها كل والد — حين يبني طفلك شيئاً بيديه ويقول: "أنا صنعت هذا!" الروبوتات تمنح الأطفال تلك اللحظة مراراً.\n\n## برامج الروبوتات في ستم تك لاب\n\n### بناة الروبوتات (٨–١٢)\nأيدٍ صغيرة تبني روبوتات حقيقية! نرسل أدوات الروبوتات لباب بيتك.\n\n### روبوتات متقدمة (١٣–١٨)\nللمهندسين الصغار المستعدين للمزيد.\n\n## لا حاجة لخبرة سابقة\n\nكل خبير كان مبتدئاً يوماً ما.\n\n## اتخذ الخطوة الأولى\n\nاحجز حصة تجريبية مجانية وشاهد شرارة الهندسة تتألق في طفلك.`,
 },
 category: "robotics",
 tags: ["robotics", "saudi-arabia", "vision-2030", "stem", "engineering", "kids"],
 targetRegions: ["Saudi Arabia", "Riyadh", "Jeddah", "Dammam"],
 metaTitle: { en: "Robotics for Kids in Saudi Arabia | StemTechLab", ar: "الروبوتات للأطفال في السعودية" },
 metaDescription: { en: "Watch your child build real robots and discover the engineer inside them. Caring robotics classes for kids in Saudi Arabia.", ar: "شاهد طفلك يبني روبوتات حقيقية ويكتشف المهندس بداخله. دروس روبوتات محبّة للأطفال." },
 author: { name: "StemTechLab Team", role: "Education Team" },
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
 en: "For Arab families in Europe: keeping your child's Arabic alive is an act of love — and it's easier than you think with the right support.",
 ar: "للعائلات العربية في أوروبا: الحفاظ على عربية طفلك عمل محبّة — وهو أسهل مما تظن مع الدعم المناسب.",
 },
 body: {
 en: `## Your Language Is Part of Who They Are\n\nIf you're an Arab family living in Europe, you know this feeling: your child speaks the school language perfectly, but their Arabic is slipping away. It's not just a language you're trying to keep — it's their connection to grandparents, to stories, to home. And that connection matters deeply.\n\n## You Don't Have to Do It Alone\n\nStructured online Arabic classes give your child a space to learn, practice, and fall in love with the language — on a schedule that fits your European life.\n\n### Arabic Reading & Writing (Ages 6–9)\nThe beauty of Arabic letters comes alive! Children learn to read, write, and discover the language one word at a time, with warm, native-speaking teachers.\n\n### Arabic Grammar (Ages 10–14)\nThrough stories and gentle exercises, children grow confident in grammar and learn to express their thoughts beautifully in Arabic.\n\n## Small Things That Make a Big Difference\n\n- **Speak Arabic at home** — even for everyday moments like meals and bedtime\n- **Watch Arabic cartoons together** — make it a family tradition\n- **Read Arabic stories before bed** — let the language wrap around them like a blanket\n- **Celebrate their progress** — every new word is a bridge to their roots\n- **Connect with community** — find Arabic-speaking playgroups and family gatherings\n\n## More Than Just Arabic\n\nStemTechLab also offers Arabic classes, coding, and robotics — all in Arabic or English. Perfect for bilingual families who want their children to grow in every direction.\n\nBook a free trial and give your child the gift of their mother tongue.`,
 ar: `## لغتكم جزء من هويتهم\n\nإذا كنتم عائلة عربية في أوروبا، تعرفون هذا الشعور: طفلكم يتحدث لغة المدرسة بطلاقة، لكن عربيته تتلاشى. ليست مجرد لغة — إنها الرابط بالأجداد والقصص والوطن.\n\n## لا تحتاجون لفعل ذلك وحدكم\n\n### القراءة والكتابة (٦–٩)\nجمال الحروف العربية يتألق! يتعلم الأطفال القراءة والكتابة مع معلمين عرب دافئين.\n\n### القواعد (١٠–١٤)\nمن خلال القصص والتمارين اللطيفة، يكتسب الأطفال الثقة بالقواعد.\n\n## أشياء صغيرة تصنع فرقاً كبيراً\n\n- تحدثوا العربية في البيت\n- شاهدوا رسوماً متحركة عربية معاً\n- اقرأوا قصصاً عربية قبل النوم\n\n## احجزوا حصة تجريبية مجانية وامنحوا طفلكم هدية لغته الأم.`,
 },
 category: "arabic",
 tags: ["arabic", "europe", "diaspora", "language-learning", "kids", "bilingual"],
 targetRegions: ["Germany", "France", "UK", "Netherlands", "Sweden", "Europe"],
 metaTitle: { en: "Arabic Classes for Kids in Europe | StemTechLab", ar: "دورات عربية للأطفال في أوروبا" },
 metaDescription: { en: "Keep your child's Arabic alive with warm, native-speaking teachers. Online classes for Arab families in Europe.", ar: "حافظ على عربية طفلك مع معلمين عرب دافئين. دروس أونلاين للعائلات العربية في أوروبا." },
 author: { name: "StemTechLab Team", role: "Education Team" },
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
 en: "A parent's guide to giving your child the skills, confidence, and curiosity to thrive in tomorrow's world — through STEM learning they'll actually enjoy.",
 ar: "دليل الوالدين لمنح طفلك المهارات والثقة والفضول ليزدهر في عالم الغد — من خلال تعلم ممتع.",
 },
 body: {
 en: `## What Is STEM — And Why Does It Matter for Your Child?\n\nSTEM stands for Science, Technology, Engineering, and Mathematics. But for your child, it means something simpler and more beautiful: learning to ask questions, try new things, build with their hands, and believe in their own ability to figure things out.\n\n## Every Age Is the Right Age to Start\n\n### Little Ones (Ages 6–9): Spark the Curiosity\nAt this age, it's all about wonder. Through colorful Scratch coding, playful robotics, and math puzzles, children discover that learning is an adventure.\n\n### Explorers (Ages 10–13): Grow and Create\nChildren are ready to go deeper — writing real Python code, solving algorithm puzzles, and building robots with sensors. They start to see what they're truly capable of.\n\n### Trailblazers (Ages 14–18): Dream Big\nTeens specialize in what excites them most — web development, competitive programming, advanced robotics, or game design. These are skills that open doors to any future they choose.\n\n## Why StemTechLab Feels Different\n\n- **Small, caring classes** — every child is seen and supported\n- **Warm, certified teachers** who love what they do\n- **Flexible scheduling** that respects your family's life\n- **Bilingual support** in English and Arabic\n- **A free trial** so your child can try before you decide\n\n## The Best Time to Start Is Now\n\nBook a free trial class and discover the path where your child will grow, create, and shine.`,
 ar: `## ما هو STEM — ولماذا يهم طفلك؟\n\nSTEM يعني العلوم والتكنولوجيا والهندسة والرياضيات. لكن لطفلك، يعني شيئاً أبسط وأجمل: تعلم طرح الأسئلة وتجربة أشياء جديدة والبناء بيديه.\n\n## كل عمر هو العمر المناسب للبدء\n\n### الصغار (٦–٩): إشعال الفضول\n### المستكشفون (١٠–١٣): النمو والإبداع\n### الرواد (١٤–١٨): أحلام كبيرة\n\n## لماذا ستم تك لاب مختلف\n\n- فصول صغيرة ومحبّة\n- معلمون دافئون ومعتمدون\n- جدول مرن يحترم حياة عائلتك\n\n## أفضل وقت للبدء هو الآن\n\nاحجز حصة تجريبية مجانية واكتشف المسار الذي سينمو فيه طفلك ويبدع ويتألق.`,
 },
 category: "stem",
 tags: ["stem", "gcc", "saudi-arabia", "uae", "qatar", "kuwait", "oman", "bahrain", "education"],
 targetRegions: ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman", "Bahrain", "GCC"],
 metaTitle: { en: "STEM Education in the GCC — Parent's Guide | StemTechLab", ar: "تعليم STEM في الخليج — دليل الوالدين" },
 metaDescription: { en: "A parent's guide to STEM for kids in the GCC. Warm, caring classes that build confidence, curiosity, and real skills.", ar: "دليل الوالدين لتعليم STEM للأطفال في الخليج. دروس دافئة تبني الثقة والفضول." },
 author: { name: "StemTechLab Team", role: "Education Team" },
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
 console.log(` ✓ ${p.slug} (${p.category})`);
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
