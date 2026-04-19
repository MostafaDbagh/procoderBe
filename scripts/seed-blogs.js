/**
 * Seed script: removes ALL blog posts and inserts 10 fresh ones with cover images.
 *
 *   node scripts/seed-blogs.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const BlogPost = require("../models/BlogPost");

const BLOGS = [
  {
    slug: "why-every-child-should-learn-coding",
    title: {
      en: "Why Every Child Should Learn to Code in 2026",
      ar: "لماذا يجب أن يتعلم كل طفل البرمجة في 2026",
    },
    excerpt: {
      en: "Coding isn't just for future developers — it teaches kids critical thinking, creativity, and confidence that lasts a lifetime.",
      ar: "البرمجة ليست فقط للمطورين — بل تعلّم الأطفال التفكير النقدي والإبداع والثقة بالنفس.",
    },
    body: {
      en: `## The Digital Generation Needs Digital Skills

In a world where technology touches every aspect of life, coding has become as fundamental as reading and writing. But it's not just about preparing kids for tech careers — it's about equipping them with a mindset that helps them thrive in any field.

## What Coding Really Teaches

**Problem-solving:** When children code, they learn to break complex problems into smaller, manageable steps. This computational thinking transfers to math, science, and everyday life decisions.

**Creativity:** Coding is creative expression through logic. Kids design games, build apps, and create digital art — turning their imagination into reality.

**Resilience:** Debugging teaches kids that mistakes aren't failures — they're clues. This growth mindset is one of the most valuable gifts coding offers.

## Starting Young Makes a Difference

Research from MIT Media Lab shows that children who start coding between ages 6-9 develop stronger logical reasoning skills. Visual programming languages like Scratch make it accessible and fun, even before kids can type fluently.

## How StemTechLab Makes It Easy

Our live, small-group classes ensure every child gets personal attention. With bilingual support in English and Arabic, certified instructors, and a warm learning environment, we make coding feel like play — not homework.`,
      ar: `## الجيل الرقمي يحتاج مهارات رقمية

في عالم تلمس فيه التكنولوجيا كل جانب من جوانب الحياة، أصبحت البرمجة أساسية كالقراءة والكتابة. لكن الأمر لا يتعلق فقط بإعداد الأطفال لمهن تقنية — بل بتزويدهم بعقلية تساعدهم على النجاح في أي مجال.

## ماذا تعلّم البرمجة حقاً

**حل المشكلات:** عندما يبرمج الأطفال يتعلمون تقسيم المشكلات المعقدة إلى خطوات صغيرة قابلة للإدارة.

**الإبداع:** البرمجة هي تعبير إبداعي من خلال المنطق. الأطفال يصممون ألعاباً ويبنون تطبيقات ويصنعون فناً رقمياً.

**المرونة:** تصحيح الأخطاء يعلّم الأطفال أن الأخطاء ليست فشلاً — بل أدلة للتحسن.

## البداية المبكرة تصنع الفرق

أظهرت أبحاث MIT أن الأطفال الذين يبدأون البرمجة بين سن 6-9 يطورون مهارات تفكير منطقي أقوى.

## كيف يسهّل ستم تك لاب الأمر

فصولنا المباشرة الصغيرة تضمن اهتماماً شخصياً لكل طفل. مع دعم ثنائي اللغة ومدربين معتمدين وبيئة تعليمية دافئة.`,
    },
    coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=630&fit=crop",
    category: "coding",
    tags: ["coding", "kids", "education", "STEM"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-04-01"),
    relatedCourses: ["scratch", "python"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "Why Every Child Should Learn Coding | StemTechLab", ar: "لماذا يجب أن يتعلم كل طفل البرمجة | ستم تك لاب" },
    metaDescription: { en: "Discover why coding is essential for children in 2026. Learn how it builds critical thinking, creativity, and confidence.", ar: "اكتشف لماذا البرمجة ضرورية للأطفال في 2026." },
  },
  {
    slug: "scratch-vs-python-which-is-right-for-your-child",
    title: {
      en: "Scratch vs Python: Which Programming Language Is Right for Your Child?",
      ar: "سكراتش أم بايثون: أي لغة برمجة مناسبة لطفلك؟",
    },
    excerpt: {
      en: "A parent's guide to choosing between Scratch and Python based on your child's age, experience, and learning goals.",
      ar: "دليل الوالدين لاختيار بين سكراتش وبايثون بناءً على عمر طفلك وخبرته وأهدافه.",
    },
    body: {
      en: `## Choosing the Right Starting Point

One of the most common questions parents ask is: "Should my child start with Scratch or Python?" The answer depends on their age, experience, and what excites them most.

## Scratch: The Perfect First Step (Ages 6-10)

Scratch, developed by MIT, uses colorful blocks that snap together like puzzle pieces. No typing required — just drag, drop, and create.

- **Best for:** Complete beginners, younger children
- **What they'll make:** Animated stories, simple games, interactive art
- **Key benefit:** Builds coding logic without the frustration of syntax errors

## Python: Real Code, Real Power (Ages 10+)

Python reads almost like English, making it the most beginner-friendly text-based language. It's used by NASA, Google, and Instagram.

- **Best for:** Kids who've outgrown visual programming
- **What they'll make:** Games, web scrapers, data projects, AI experiments
- **Key benefit:** Industry-relevant skills that grow with them

## The StemTechLab Path

We recommend starting with Scratch (ages 6-9), then transitioning to Python (ages 10+). Our curriculum creates a smooth bridge between the two, so children never feel lost or overwhelmed.`,
      ar: `## اختيار نقطة البداية الصحيحة

أحد أكثر الأسئلة شيوعاً من الوالدين هو: "هل يبدأ طفلي بسكراتش أم بايثون؟" الإجابة تعتمد على عمره وخبرته وما يثيره أكثر.

## سكراتش: الخطوة الأولى المثالية (6-10 سنوات)

سكراتش من تطوير MIT يستخدم كتلاً ملونة تتصل ببعضها كقطع الأحجية.

- **الأفضل لـ:** المبتدئين تماماً والأطفال الأصغر
- **ما سيصنعون:** قصص متحركة وألعاب بسيطة وفن تفاعلي

## بايثون: كود حقيقي وقوة حقيقية (10+ سنوات)

بايثون تقرأ تقريباً كالإنجليزية مما يجعلها أسهل لغة نصية للمبتدئين. تستخدمها ناسا وجوجل وإنستغرام.

- **الأفضل لـ:** الأطفال الذين تجاوزوا البرمجة المرئية
- **ما سيصنعون:** ألعاب ومشاريع بيانات وتجارب ذكاء اصطناعي

## مسار ستم تك لاب

نوصي بالبدء بسكراتش (6-9 سنوات) ثم الانتقال لبايثون (10+). منهجنا يصنع جسراً سلساً بين الاثنين.`,
    },
    coverImage: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&h=630&fit=crop",
    category: "coding",
    tags: ["scratch", "python", "comparison", "parents"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-03-25"),
    relatedCourses: ["scratch", "python"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "Scratch vs Python for Kids | StemTechLab", ar: "سكراتش أم بايثون للأطفال | ستم تك لاب" },
    metaDescription: { en: "Compare Scratch and Python for kids. Find the best programming language based on your child's age and experience.", ar: "قارن بين سكراتش وبايثون للأطفال." },
  },
  {
    slug: "5-benefits-of-robotics-for-children",
    title: {
      en: "5 Amazing Benefits of Robotics Education for Children",
      ar: "5 فوائد مذهلة لتعليم الروبوتات للأطفال",
    },
    excerpt: {
      en: "Robotics isn't just about building machines — it develops teamwork, engineering thinking, and hands-on problem solving.",
      ar: "الروبوتات ليست فقط عن بناء الآلات — بل تطور العمل الجماعي والتفكير الهندسي وحل المشكلات العملي.",
    },
    body: {
      en: `## Beyond the Robot: Life Skills That Last

When children build robots, they're doing much more than connecting wires and writing code. They're developing fundamental skills that will serve them throughout their lives.

## 1. Hands-On Learning

Robotics turns abstract concepts into tangible experiences. When a child sees their code make a robot move, the connection between instruction and action becomes real and memorable.

## 2. Engineering Mindset

Children learn to design, prototype, test, and iterate. This engineering process teaches them that the first attempt rarely works — and that's perfectly okay.

## 3. Teamwork & Communication

In our robotics classes, children work together to solve challenges. They learn to share ideas, divide tasks, and celebrate collective achievements.

## 4. Cross-Disciplinary Learning

Robotics naturally integrates math, science, technology, and even art. Children apply real math to calculate distances and angles, and use physics to understand motion.

## 5. Confidence Through Creation

There's nothing quite like the pride on a child's face when their robot completes a task for the first time. This sense of accomplishment builds lasting confidence.`,
      ar: `## أبعد من الروبوت: مهارات حياتية تدوم

عندما يبني الأطفال الروبوتات فإنهم يفعلون أكثر بكثير من توصيل الأسلاك وكتابة الكود. إنهم يطورون مهارات أساسية ستخدمهم طوال حياتهم.

## 1. التعلم العملي

الروبوتات تحول المفاهيم المجردة إلى تجارب ملموسة.

## 2. العقلية الهندسية

يتعلم الأطفال التصميم والنمذجة والاختبار والتكرار.

## 3. العمل الجماعي والتواصل

في فصول الروبوتات يعمل الأطفال معاً لحل التحديات.

## 4. التعلم متعدد التخصصات

الروبوتات تدمج الرياضيات والعلوم والتكنولوجيا وحتى الفن بشكل طبيعي.

## 5. الثقة من خلال الإبداع

لا شيء يضاهي الفخر على وجه الطفل عندما يكمل روبوته مهمة لأول مرة.`,
    },
    coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=630&fit=crop",
    category: "robotics",
    tags: ["robotics", "STEM", "engineering", "kids"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-03-18"),
    relatedCourses: ["robot-basics"],
    targetRegions: ["Saudi Arabia", "UAE", "Kuwait", "Qatar"],
    metaTitle: { en: "5 Benefits of Robotics for Kids | StemTechLab", ar: "5 فوائد الروبوتات للأطفال | ستم تك لاب" },
    metaDescription: { en: "Discover 5 key benefits of robotics education for children including problem-solving, teamwork, and engineering skills.", ar: "اكتشف 5 فوائد رئيسية لتعليم الروبوتات للأطفال." },
  },
  {
    slug: "screen-time-into-learning-time",
    title: {
      en: "How to Turn Screen Time Into Meaningful Learning Time",
      ar: "كيف تحوّل وقت الشاشة إلى وقت تعلّم مفيد",
    },
    excerpt: {
      en: "Not all screen time is equal. Learn how coding and creative technology transform passive watching into active creation.",
      ar: "ليس كل وقت شاشة متساوٍ. تعلّم كيف تحول البرمجة والتكنولوجيا الإبداعية المشاهدة السلبية إلى إبداع نشط.",
    },
    body: {
      en: `## The Screen Time Dilemma Every Parent Faces

As parents, we worry about how much time our children spend on screens. But the question isn't just "how much" — it's "what kind."

## Passive vs Active Screen Time

**Passive:** Scrolling social media, watching random videos, playing addictive games with no learning value.

**Active:** Creating games, building apps, solving coding puzzles, designing digital art, learning new skills.

## Making the Switch

Here's how to transform screen time from a concern into an opportunity:

**1. Replace consumption with creation.** Instead of watching gaming videos, your child can build their own games.

**2. Set goals together.** "This week, let's code a birthday card for grandma" gives screen time purpose.

**3. Choose structured programs.** Live classes with real teachers provide accountability and social learning.

**4. Celebrate what they make.** When children show you what they've created, they feel proud — not guilty — about their screen time.

## The StemTechLab Difference

Our live classes turn screens into creative workshops. Children don't just stare at screens — they use them as tools to bring their ideas to life.`,
      ar: `## معضلة وقت الشاشة التي يواجهها كل والد

كآباء نقلق بشأن الوقت الذي يقضيه أطفالنا على الشاشات. لكن السؤال ليس فقط "كم" — بل "أي نوع."

## وقت شاشة سلبي مقابل نشط

**السلبي:** تصفح وسائل التواصل ومشاهدة فيديوهات عشوائية ولعب ألعاب إدمانية.

**النشط:** إنشاء ألعاب وبناء تطبيقات وحل ألغاز برمجية وتصميم فن رقمي.

## إجراء التحول

إليك كيفية تحويل وقت الشاشة من قلق إلى فرصة:

**1. استبدل الاستهلاك بالإبداع.** بدلاً من مشاهدة فيديوهات الألعاب يمكن لطفلك بناء ألعابه الخاصة.

**2. ضعوا أهدافاً معاً.** "هذا الأسبوع لنبرمج بطاقة عيد ميلاد للجدة" يعطي وقت الشاشة هدفاً.

**3. اختر برامج منظمة.** الفصول المباشرة مع معلمين حقيقيين توفر المسؤولية والتعلم الاجتماعي.

**4. احتفل بما يصنعون.** عندما يريك الأطفال ما أبدعوه يشعرون بالفخر لا بالذنب.`,
    },
    coverImage: "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=1200&h=630&fit=crop",
    category: "parenting",
    tags: ["screen-time", "parenting", "digital-wellness", "education"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-03-10"),
    relatedCourses: ["scratch", "gamedev"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "Screen Time to Learning Time | StemTechLab", ar: "وقت الشاشة إلى وقت التعلم | ستم تك لاب" },
    metaDescription: { en: "Transform your child's screen time from passive watching to active coding and creation.", ar: "حوّل وقت شاشة طفلك من مشاهدة سلبية إلى برمجة وإبداع نشط." },
  },
  {
    slug: "game-development-for-kids-complete-guide",
    title: {
      en: "Game Development for Kids: A Complete Beginner's Guide",
      ar: "تطوير الألعاب للأطفال: دليل المبتدئين الشامل",
    },
    excerpt: {
      en: "Your child can build their own video games! Here's everything parents need to know about game development education.",
      ar: "طفلك يستطيع بناء ألعاب الفيديو الخاصة به! إليك كل ما يحتاج الوالدان معرفته عن تعليم تطوير الألعاب.",
    },
    body: {
      en: `## From Player to Creator

Every child who loves playing games has the potential to create them. Game development combines coding, art, storytelling, and logic into one exciting discipline.

## What Is Game Development for Kids?

It's a structured way to teach children programming through the lens of creating games. Children learn real coding concepts while building something they're passionate about.

## Age-Appropriate Tools

- **Ages 6-8:** Scratch — drag-and-drop game creation
- **Ages 9-12:** Scratch Advanced + intro to typed code
- **Ages 13+:** Python with Pygame, JavaScript with HTML5 Canvas

## What Kids Learn

- **Logic & sequences:** Game rules require clear, ordered instructions
- **Coordinate systems:** Placing characters on a grid teaches math naturally
- **Event handling:** "When the player presses jump, do this" — cause and effect
- **Design thinking:** Making games fun requires empathy and iteration

## Getting Started at StemTechLab

Our Game Development course takes kids from zero to publishing their first game. They learn through hands-on projects, building progressively complex games each week.`,
      ar: `## من لاعب إلى مبدع

كل طفل يحب لعب الألعاب لديه القدرة على إبداعها. تطوير الألعاب يجمع بين البرمجة والفن والسرد والمنطق.

## ما هو تطوير الألعاب للأطفال؟

إنه طريقة منظمة لتعليم الأطفال البرمجة من خلال عدسة إنشاء الألعاب.

## أدوات مناسبة للعمر

- **6-8 سنوات:** سكراتش — إنشاء ألعاب بالسحب والإفلات
- **9-12 سنة:** سكراتش متقدم + مقدمة للكود المكتوب
- **13+ سنة:** بايثون مع Pygame وجافاسكريبت

## ماذا يتعلم الأطفال

- **المنطق والتسلسل:** قواعد اللعبة تتطلب تعليمات واضحة ومرتبة
- **أنظمة الإحداثيات:** وضع الشخصيات على شبكة يعلّم الرياضيات
- **معالجة الأحداث:** "عندما يضغط اللاعب قفز، افعل هذا"
- **التفكير التصميمي:** جعل الألعاب ممتعة يتطلب التعاطف والتكرار`,
    },
    coverImage: "https://images.unsplash.com/photo-1556438064-2d7646166914?w=1200&h=630&fit=crop",
    category: "coding",
    tags: ["game-development", "kids", "coding", "beginner"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-03-05"),
    relatedCourses: ["gamedev", "scratch"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "Game Development for Kids Guide | StemTechLab", ar: "دليل تطوير الألعاب للأطفال | ستم تك لاب" },
    metaDescription: { en: "Complete guide to game development education for children. Learn tools, skills, and how to get started.", ar: "دليل شامل لتعليم تطوير الألعاب للأطفال." },
  },
  {
    slug: "teaching-arabic-to-children-in-digital-age",
    title: {
      en: "Teaching Arabic to Children in the Digital Age",
      ar: "تعليم العربية للأطفال في العصر الرقمي",
    },
    excerpt: {
      en: "How technology and live teaching combine to make Arabic learning engaging and effective for the new generation.",
      ar: "كيف تتضافر التكنولوجيا والتعليم المباشر لجعل تعلّم العربية ممتعاً وفعّالاً للجيل الجديد.",
    },
    body: {
      en: `## Arabic in a Connected World

For families in the GCC and diaspora communities worldwide, teaching children Arabic is both a priority and a challenge. In an age of English-dominant media, how do we keep children connected to their linguistic heritage?

## The Challenge Parents Face

Many children grow up speaking Arabic at home but struggle with reading and writing. The gap between conversational and academic Arabic can feel overwhelming.

## How Technology Helps

- **Interactive exercises:** Digital tools make Arabic letter formation fun through games and visual feedback
- **Live native teachers:** Nothing replaces a warm, encouraging teacher who speaks Arabic natively
- **Consistent practice:** Online platforms enable daily 15-minute practice sessions that build habit

## Our Approach at StemTechLab

We combine the warmth of traditional Arabic teaching with modern interactive methods. Our native Arabic teachers make every lesson feel like a conversation with a caring family friend.`,
      ar: `## العربية في عالم متصل

للعائلات في الخليج والمجتمعات المغتربة حول العالم، تعليم الأطفال العربية هو أولوية وتحدٍ في آن واحد.

## التحدي الذي يواجه الوالدين

كثير من الأطفال يكبرون وهم يتحدثون العربية في المنزل لكن يواجهون صعوبة في القراءة والكتابة.

## كيف تساعد التكنولوجيا

- **تمارين تفاعلية:** الأدوات الرقمية تجعل تشكيل الحروف العربية ممتعاً
- **معلمون عرب مباشرون:** لا شيء يعوض معلماً دافئاً ومشجعاً يتحدث العربية بطلاقة
- **ممارسة منتظمة:** المنصات الإلكترونية تمكّن من جلسات ممارسة يومية مدتها 15 دقيقة

## نهجنا في ستم تك لاب

نجمع بين دفء التعليم العربي التقليدي والأساليب التفاعلية الحديثة. معلمونا العرب يجعلون كل درس يبدو كمحادثة مع صديق عائلة محبّ.`,
    },
    coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=630&fit=crop",
    category: "arabic",
    tags: ["arabic", "language", "education", "digital-learning"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-02-28"),
    relatedCourses: ["arabic-reading", "arabic-grammar"],
    targetRegions: ["Saudi Arabia", "UAE", "Kuwait", "Qatar", "Bahrain"],
    metaTitle: { en: "Teaching Arabic to Kids Online | StemTechLab", ar: "تعليم العربية للأطفال أونلاين | ستم تك لاب" },
    metaDescription: { en: "Modern approaches to teaching Arabic to children using technology and live native teachers.", ar: "أساليب حديثة لتعليم العربية للأطفال باستخدام التكنولوجيا والمعلمين العرب." },
  },
  {
    slug: "what-is-stem-education-parent-guide",
    title: {
      en: "What Is STEM Education? A Simple Guide for Parents",
      ar: "ما هو تعليم STEM؟ دليل بسيط للوالدين",
    },
    excerpt: {
      en: "STEM stands for Science, Technology, Engineering, and Math — but it's really about teaching kids to think, explore, and create.",
      ar: "STEM تعني العلوم والتكنولوجيا والهندسة والرياضيات — لكنها حقاً عن تعليم الأطفال التفكير والاستكشاف والإبداع.",
    },
    body: {
      en: `## STEM: More Than an Acronym

You've probably heard the term "STEM education" everywhere. But what does it really mean for your child, and why does it matter?

## Breaking It Down

- **Science:** Understanding the natural world through observation and experiments
- **Technology:** Using tools — from simple apps to complex code — to solve problems
- **Engineering:** Designing and building solutions to real-world challenges
- **Math:** The universal language that connects all STEM disciplines

## Why STEM Matters in 2026

The World Economic Forum predicts that 65% of children entering school today will work in jobs that don't yet exist. STEM education prepares children not for specific careers, but for a future we can't fully predict.

## STEM for Every Child

STEM isn't just for "math kids" or "science kids." It's for every child who has ever asked "why?" or "how?" — which is every child.

## How StemTechLab Brings STEM to Life

We don't just teach STEM subjects — we make them come alive through projects, challenges, and creative exploration. Our kids build robots, code games, solve algorithmic puzzles, and create digital art.`,
      ar: `## STEM: أكثر من اختصار

ربما سمعت مصطلح "تعليم STEM" في كل مكان. لكن ماذا يعني حقاً لطفلك ولماذا هو مهم؟

## تفصيل المصطلح

- **العلوم:** فهم العالم الطبيعي من خلال الملاحظة والتجارب
- **التكنولوجيا:** استخدام الأدوات لحل المشكلات
- **الهندسة:** تصميم وبناء حلول لتحديات العالم الحقيقي
- **الرياضيات:** اللغة العالمية التي تربط جميع تخصصات STEM

## لماذا STEM مهم في 2026

يتوقع المنتدى الاقتصادي العالمي أن 65% من الأطفال الذين يدخلون المدرسة اليوم سيعملون في وظائف لم توجد بعد.

## STEM لكل طفل

STEM ليس فقط لـ"أطفال الرياضيات" أو "أطفال العلوم." إنه لكل طفل سأل يوماً "لماذا؟" أو "كيف؟"

## كيف يحيي ستم تك لاب STEM

لا نعلّم مواد STEM فقط — بل نجعلها تنبض بالحياة من خلال المشاريع والتحديات والاستكشاف الإبداعي.`,
    },
    coverImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&h=630&fit=crop",
    category: "stem",
    tags: ["STEM", "education", "parents", "guide"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-02-20"),
    relatedCourses: ["scratch", "robot-basics", "algo-intro"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "What Is STEM Education? Parent Guide | StemTechLab", ar: "ما هو تعليم STEM؟ دليل الوالدين | ستم تك لاب" },
    metaDescription: { en: "A simple guide explaining STEM education for parents. Learn what it means and why it matters for your child.", ar: "دليل بسيط يشرح تعليم STEM للوالدين." },
  },
  {
    slug: "how-algorithms-teach-kids-to-think",
    title: {
      en: "How Algorithms Teach Kids to Think Like Problem-Solvers",
      ar: "كيف تعلّم الخوارزميات الأطفال التفكير كحلّالين للمشكلات",
    },
    excerpt: {
      en: "Algorithms aren't scary math — they're step-by-step recipes that teach children structured thinking and logical reasoning.",
      ar: "الخوارزميات ليست رياضيات مخيفة — بل وصفات خطوة بخطوة تعلّم الأطفال التفكير المنظم والمنطقي.",
    },
    body: {
      en: `## Algorithms Are Everywhere

Your child already uses algorithms every day — they just don't know it yet. Getting dressed in the morning? That's an algorithm. Following a recipe? Algorithm. Organizing toys by color? Algorithm.

## What Are Algorithms, Really?

An algorithm is simply a set of clear, ordered steps to solve a problem or complete a task. When we teach children algorithms, we're teaching them to:

- Break big problems into small steps
- Think in sequences and patterns
- Find the most efficient solution
- Test and improve their approach

## Why Algorithmic Thinking Matters

Studies show that children who learn algorithmic thinking perform better in math, reading comprehension, and even creative writing. It's because the same skill — breaking complexity into manageable parts — applies everywhere.

## Making It Fun

At StemTechLab, we teach algorithms through puzzles, games, and real-world challenges. Children solve mazes, sort objects, find patterns, and compete in friendly coding challenges — all while building powerful thinking skills.`,
      ar: `## الخوارزميات في كل مكان

طفلك يستخدم الخوارزميات كل يوم بالفعل — لكنه لا يعرف ذلك بعد. ارتداء الملابس صباحاً؟ هذه خوارزمية. اتباع وصفة طبخ؟ خوارزمية. ترتيب الألعاب حسب اللون؟ خوارزمية.

## ما هي الخوارزميات حقاً؟

الخوارزمية ببساطة هي مجموعة من الخطوات الواضحة والمرتبة لحل مشكلة أو إكمال مهمة.

## لماذا التفكير الخوارزمي مهم

تُظهر الدراسات أن الأطفال الذين يتعلمون التفكير الخوارزمي يؤدون أفضل في الرياضيات وفهم القراءة وحتى الكتابة الإبداعية.

## جعلها ممتعة

في ستم تك لاب نعلّم الخوارزميات من خلال الألغاز والألعاب وتحديات العالم الحقيقي.`,
    },
    coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=630&fit=crop",
    category: "stem",
    tags: ["algorithms", "thinking", "problem-solving", "kids"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-02-12"),
    relatedCourses: ["algo-intro", "algo-competitive"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "Algorithms for Kids: Thinking Skills | StemTechLab", ar: "الخوارزميات للأطفال: مهارات التفكير | ستم تك لاب" },
    metaDescription: { en: "How algorithmic thinking teaches children structured problem-solving and logical reasoning.", ar: "كيف يعلّم التفكير الخوارزمي الأطفال حل المشكلات المنظم." },
  },
  {
    slug: "online-learning-vs-in-person-for-kids",
    title: {
      en: "Online vs In-Person Learning: Why Live Online Classes Work Best for Kids",
      ar: "التعلم الأونلاين مقابل الحضوري: لماذا الفصول المباشرة الأفضل للأطفال",
    },
    excerpt: {
      en: "Live online classes combine the best of both worlds — the convenience of home with the engagement of a real classroom.",
      ar: "الفصول المباشرة عبر الإنترنت تجمع أفضل ما في العالمين — راحة المنزل مع تفاعل الفصل الحقيقي.",
    },
    body: {
      en: `## The New Normal of Learning

The pandemic changed education forever. But even as the world opened back up, many families discovered that online learning — done right — offers advantages that in-person classes can't match.

## Why Live Online Classes Excel

**1. Expert teachers, anywhere.** Your child in Riyadh can learn from the best instructor in Dubai or Amman. Geography is no longer a barrier to quality.

**2. Safe and comfortable.** Children learn in their own space, surrounded by family. No commute stress, no unfamiliar environments.

**3. Small groups, big attention.** Our classes cap at 6 students, ensuring every child gets personal feedback and encouragement.

**4. Recorded for review.** Missed something? Review the session at your own pace.

**5. Schedule flexibility.** Choose time slots that work for your family, not the other way around.

## What Makes StemTechLab Different

We're not a video library — we're a live learning community. Our teachers know each child by name, celebrate their progress, and adapt lessons to their pace.`,
      ar: `## الوضع الطبيعي الجديد للتعلم

غيّر الوباء التعليم للأبد. لكن حتى مع عودة الحياة إلى طبيعتها اكتشفت عائلات كثيرة أن التعلم عبر الإنترنت — عندما يُنفذ بشكل صحيح — يقدم مزايا لا تستطيع الفصول الحضورية مجاراتها.

## لماذا تتفوق الفصول المباشرة عبر الإنترنت

**1. معلمون خبراء في أي مكان.** طفلك في الرياض يمكنه التعلم من أفضل مدرب في دبي أو عمّان.

**2. آمن ومريح.** يتعلم الأطفال في مساحتهم الخاصة محاطين بالعائلة.

**3. مجموعات صغيرة واهتمام كبير.** فصولنا لا تتجاوز 6 طلاب.

**4. مسجلة للمراجعة.** فاتك شيء؟ راجع الجلسة في وقتك.

**5. مرونة الجدول.** اختر الأوقات التي تناسب عائلتك.

## ما يميز ستم تك لاب

نحن لسنا مكتبة فيديو — بل مجتمع تعلم مباشر. معلمونا يعرفون كل طفل بالاسم ويحتفلون بتقدمه.`,
    },
    coverImage: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=1200&h=630&fit=crop",
    category: "general",
    tags: ["online-learning", "live-classes", "education", "comparison"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-02-05"),
    relatedCourses: ["scratch", "python", "robot-basics"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "Online vs In-Person Learning for Kids | StemTechLab", ar: "التعلم الأونلاين مقابل الحضوري للأطفال | ستم تك لاب" },
    metaDescription: { en: "Why live online classes are the best learning format for kids. Small groups, expert teachers, flexible schedules.", ar: "لماذا الفصول المباشرة هي أفضل شكل تعليم للأطفال." },
  },
  {
    slug: "mobile-app-development-for-kids",
    title: {
      en: "Mobile App Development for Kids: Building Tomorrow's Innovators",
      ar: "تطوير تطبيقات الجوال للأطفال: بناء مبتكري الغد",
    },
    excerpt: {
      en: "Your child uses apps every day — now they can learn to build their own. From idea to app store, here's how kids become app creators.",
      ar: "طفلك يستخدم التطبيقات يومياً — الآن يمكنه تعلّم بنائها. من الفكرة إلى متجر التطبيقات.",
    },
    body: {
      en: `## From App User to App Creator

Children spend hours using apps. What if they could create their own? Mobile app development for kids is one of the most engaging ways to teach coding, design, and entrepreneurial thinking.

## What Kids Learn in App Development

**UI/UX Design:** Understanding how to make apps user-friendly and beautiful. Kids learn about buttons, layouts, colors, and navigation — skills that combine art and logic.

**Programming Logic:** App development teaches event-driven programming — "when the user taps this button, show that screen." This cause-and-effect thinking strengthens problem-solving.

**Project Management:** Building an app from scratch teaches planning, prioritization, and completing multi-step projects.

## Real Projects Our Students Build

- **Health Tracker App:** Track water intake, exercise, and sleep with colorful charts
- **Quiz Game App:** Create interactive trivia games to share with friends
- **Digital Journal:** A private space for daily reflections with photos and stickers

## Getting Started

Our Mobile App Development course is designed for kids ages 10-16 with basic coding experience. Students work on real projects using industry tools, guided step-by-step by our expert instructors.`,
      ar: `## من مستخدم تطبيقات إلى مبدع تطبيقات

يقضي الأطفال ساعات في استخدام التطبيقات. ماذا لو استطاعوا إنشاء تطبيقاتهم الخاصة؟

## ماذا يتعلم الأطفال في تطوير التطبيقات

**تصميم UI/UX:** فهم كيفية جعل التطبيقات سهلة الاستخدام وجميلة.

**منطق البرمجة:** تطوير التطبيقات يعلّم البرمجة المبنية على الأحداث.

**إدارة المشاريع:** بناء تطبيق من الصفر يعلّم التخطيط وتحديد الأولويات.

## مشاريع حقيقية يبنيها طلابنا

- **تطبيق تتبع الصحة:** تتبع شرب الماء والتمارين والنوم
- **تطبيق لعبة أسئلة:** إنشاء ألعاب معلومات تفاعلية
- **يوميات رقمية:** مساحة خاصة للتأملات اليومية مع الصور

## البداية

دورة تطوير تطبيقات الجوال مصممة للأطفال من 10-16 سنة مع خبرة برمجة أساسية.`,
    },
    coverImage: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=630&fit=crop",
    category: "coding",
    tags: ["mobile-development", "apps", "kids", "coding"],
    author: { name: "StemTechLab Team", role: "Education" },
    isPublished: true,
    publishedAt: new Date("2026-01-28"),
    relatedCourses: ["mobappdev", "python"],
    targetRegions: ["Saudi Arabia", "UAE", "GCC"],
    metaTitle: { en: "Mobile App Development for Kids | StemTechLab", ar: "تطوير تطبيقات الجوال للأطفال | ستم تك لاب" },
    metaDescription: { en: "Kids can learn to build real mobile apps. From UI design to coding logic, discover our app development course.", ar: "يمكن للأطفال تعلّم بناء تطبيقات جوال حقيقية." },
  },
];

// Calculate read time from English body
for (const b of BLOGS) {
  const words = b.body.en.split(/\s+/).length;
  b.readTimeMinutes = Math.max(1, Math.ceil(words / 200));
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const deleted = await BlogPost.deleteMany({});
    console.log(`Removed ${deleted.deletedCount} old blog posts`);

    const created = await BlogPost.insertMany(BLOGS);
    console.log(`Seeded ${created.length} blog posts:`);
    created.forEach((b) =>
      console.log(`  ✔ ${b.slug} — ${b.title.en} [${b.category}] cover: ${b.coverImage ? "yes" : "NO"}`)
    );

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

run();
