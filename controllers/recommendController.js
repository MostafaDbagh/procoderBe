const Course = require("../models/Course");
const ensureDefaultCourses = require("../services/ensureDefaultCourses");
const { coerceGender } = require("../config/childProfileSchema");
const { evidenceScoringDelta, enrichProfileWithEvidenceContext } = require("../config/evidenceBasedFramework");

// ============================================================
// STEMTECHLAB AI PARSER — Zero API dependency
// Pure NLP: regex, keyword dictionaries, pattern matching
// Supports: English, Arabic (Gulf/Egyptian/Levantine/Maghreb),
// Arabizi/Franco-Arabic, and mixed input
// ============================================================

// ── LANGUAGE DETECTION ──────────────────────────────────────

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function detectLanguage(text) {
 const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
 const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
 if (arabicChars === 0 && latinChars === 0) return "en";
 return arabicChars > latinChars ? "ar" : "en";
}

// ── TEXT NORMALIZATION ──────────────────────────────────────

// Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to Western
function normalizeArabicNumerals(text) {
 return text.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

// Normalize common Arabizi number-letter substitutions
function normalizeArabizi(text) {
 return text
 .replace(/3'/g, "غ").replace(/3/g, "ع")
 .replace(/7'/g, "خ").replace(/7/g, "ح")
 .replace(/5/g, "خ")
 .replace(/8/g, "ق")
 .replace(/9/g, "ص")
 .replace(/6/g, "ط")
 .replace(/2/g, "أ")
 .replace(/4/g, "ذ");
}

function normalizeText(text) {
 let t = text.toLowerCase().trim();
 t = normalizeArabicNumerals(t);
 // Remove tatweel, diacritics
 t = t.replace(/\u0640/g, ""); // tatweel
 t = t.replace(/[\u064B-\u065F\u0670]/g, ""); // harakat
 // Normalize alef variants
 t = t.replace(/[إأآا]/g, "ا");
 // Normalize taa marbuta
 t = t.replace(/ة/g, "ه");
 return t;
}

// ── AGE EXTRACTION ──────────────────────────────────────────

function extractAge(text) {
 const normalized = normalizeArabicNumerals(text.toLowerCase());

 // Direct patterns: "7 years", "age 7", "7 سنوات", "عمره 7"
 const patterns = [
 /(?:age|aged|is|he's|she's|he is|she is|child is|kid is|son is|daughter is)\s*(\d{1,2})/i,
 /(\d{1,2})\s*(?:years?\s*old|yrs?\s*old|year|سنه|سنوات|سنين|سنة|سنتين|اعوام)/i,
 /(?:عمر[هاوي]?|عمرها|عمره)\s*(\d{1,2})/,
 /(\d{1,2})\s*(?:sneen|sene|sanawat|sana)/i,
 /(?:omr[ouh]?|3omr[ouh]?|3umr[ouh]?)\s*(\d{1,2})/i,
 /(?:عنده?|عندها?|عندو|له|لها)\s*(\d{1,2})\s*سن/,
 /(?:ابن[يت]?|ولد[يت]?|بنت[يت]?|طفل[يت]?)\s*(?:عمر[هاوي]?\s*)?(\d{1,2})/,
 /(\d{1,2})\s*(?:year|سن)/i,
 ];

 for (const p of patterns) {
 const m = normalized.match(p);
 if (m) {
 const age = parseInt(m[1], 10);
 if (age >= 3 && age <= 20) return age;
 }
 }

 // Grade-level inference
 const gradeMap = [
 [/(?:kg\s*1|كي جي\s*1|روضه اولى|pre-?k)/i, 5],
 [/(?:kg\s*2|كي جي\s*2|روضه تانيه|تمهيدي)/i, 6],
 [/(?:first\s*grade|grade\s*1|اول\s*ابتدائي|صف\s*اول|اولى ابتدائي)/i, 6],
 [/(?:second\s*grade|grade\s*2|ثاني?\s*ابتدائي|صف\s*ثاني)/i, 7],
 [/(?:third\s*grade|grade\s*3|ثالث?\s*ابتدائي|صف\s*ثالث)/i, 8],
 [/(?:fourth\s*grade|grade\s*4|رابع?\s*ابتدائي|صف\s*رابع)/i, 9],
 [/(?:fifth\s*grade|grade\s*5|خامس?\s*ابتدائي|صف\s*خامس)/i, 10],
 [/(?:sixth\s*grade|grade\s*6|سادس?\s*ابتدائي|صف\s*سادس)/i, 11],
 [/(?:seventh\s*grade|grade\s*7|اول\s*متوسط|سابع)/i, 12],
 [/(?:eighth\s*grade|grade\s*8|ثاني?\s*متوسط|ثامن)/i, 13],
 [/(?:ninth\s*grade|grade\s*9|ثالث?\s*متوسط|تاسع)/i, 14],
 [/(?:tenth\s*grade|grade\s*10|اول\s*ثانوي|عاشر)/i, 15],
 [/(?:eleventh\s*grade|grade\s*11|ثاني?\s*ثانوي|حادي?\s*عشر)/i, 16],
 [/(?:twelfth\s*grade|grade\s*12|ثالث?\s*ثانوي|ثاني?\s*عشر)/i, 17],
 [/(?:middle\s*school|متوسط|اعدادي|إعدادي)/i, 13],
 [/(?:high\s*school|ثانوي|ثانويه)/i, 16],
 [/(?:teenager|مراهق|مراهقه)/i, 14],
 [/(?:pre-?teen|pre\s*teen)/i, 11],
 [/(?:toddler|طفل صغير|صغير)/i, null],
 ];

 for (const [regex, age] of gradeMap) {
 if (regex.test(normalized)) return age;
 }

 return null;
}

// ── GENDER EXTRACTION ───────────────────────────────────────

function extractGender(text) {
 const t = normalizeText(text);

 const boyPatterns = [
 /\b(?:son|boy|he |he's|him|his|brother)\b/i,
 /(?:ابني|ولدي|ابن[يه]|ولد[يه]|الولد|طفلي|الصبي)/,
 // (?<!ت) avoids matching يحب inside تحب (Arabic feminine "she loves")
 /(?:عنده|(?<!ت)يحب|يبي|يبغى|عمره|بيحب|بدو|كيحب)/,
 /\b(?:ibni|waladi|weldi|ebni)\b/i,
 ];

 const girlPatterns = [
 /\b(?:daughter|girl|she |she's|her |her$|sister)\b/i,
 /(?:بنتي|بنيتي|ابنتي|البنت|طفلتي)/,
 /(?:^|[\s،])بنت\s+(?:عمرها|عمر)\s/,
 /عندي\s+بنت\s+عمرها/,
 /(?:عندها|تحب|تبي|تبغى|عمرها|بتحب|بدها|كتحب)/,
 /\b(?:binti|benti|bnayti)\b/i,
 ];

 let boyScore = 0;
 let girlScore = 0;

 for (const p of boyPatterns) { if (p.test(t) || p.test(text)) boyScore++; }
 for (const p of girlPatterns) { if (p.test(t) || p.test(text)) girlScore++; }

 if (boyScore > girlScore) return "boy";
 if (girlScore > boyScore) return "girl";
 return null;
}

// ── ADJECTIVE EXTRACTION (comprehensive keyword dictionaries) ─

// Each entry: { tokens: [keywords/phrases], trait: "normalized_trait" }
const ADJECTIVE_DICTIONARY = [
 // --- Energy & Activity ---
 { trait: "hyperactive", tokens: [
 "hyperactive", "hyper active", "hyper", "can't sit still", "cant sit still",
 "always moving", "restless", "bouncy", "energetic", "very active", "super active",
 "high energy", "full of energy", "never stops", "on the go", "fidgety", "wild",
 "lots of energy", "too much energy", "really active", "very active", "super active",
 "نشيط", "كثير الحركه", "مايقعد", "ما يقعد", "مايهدى", "ما يهدا",
 "طاقته عاليه", "طاقه عاليه", "مفرط الحركه", "كثير حركه", "مايوقف",
 "عنده طاقه", "نشيطه", "مايقعد ساكت", "ما يقعد ساكت",
 "na8i", "nashee6", "7araka", "nashit",
 ]},
 { trait: "active", tokens: [
 "active", "active kid", "quite active", "physically active", "always on the move",
 "نشيط", "طفل نشيط",
 ]},
 { trait: "restless", tokens: [
 "restless", "can't settle", "cant settle", "fidgets a lot",
 "مايهدى", "ما يهدأ",
 ]},
 { trait: "calm", tokens: [
 "calm", "laid back", "laid-back", "easygoing", "easy-going", "relaxed", "chill", "mellow",
 "هادي", "هاديه", "ساكن", "ساكنه", "هادئ", "هادئه", "مرتاح", "رايق",
 ]},
 { trait: "sedentary", tokens: [
 "lazy", "couch potato", "doesn't move", "inactive",
 "كسلان", "كسلانه", "مايتحرك", "ما يتحرك",
 ]},

 // --- Social ---
 { trait: "shy", tokens: [
 "shy", "timid", "withdrawn", "reserved", "doesn't talk much", "quiet around people",
 "doesn't like talking", "hides behind me", "scared of people", "avoids groups",
 "خجول", "خجوله", "يستحي", "تستحي", "مايتكلم", "ما يتكلم", "ساكت", "ساكته",
 "مايحب يتكلم", "يخاف من الناس", "5ajool", "5ajoul",
 ]},
 { trait: "social", tokens: [
 "social", "outgoing", "extroverted", "social butterfly", "loves people", "loves friends",
 "loves being around people", "talkative", "chatty", "friendly", "makes friends easily",
 "اجتماعي", "اجتماعيه", "يحب الناس", "تحب الناس", "يحب اصحابه", "تحب صحباتها",
 "يتكلم كثير", "كثير سوالف", "اجتماعيه", "ejtema3i",
 ]},
 { trait: "introverted", tokens: [
 "introverted", "introvert", "loner", "prefers alone", "likes being alone",
 "plays alone", "independent worker",
 "انطوائي", "انطوائيه", "يحب يقعد لحاله", "تحب تقعد لحالها",
 "يشتغل لحاله", "يلعب لحاله",
 ]},
 { trait: "leader", tokens: [
 "leader", "leadership", "bossy", "takes charge", "natural leader",
 "leads others", "likes to direct", "in charge",
 "قيادي", "قياديه", "يحب يوجه", "يقود", "زعيم",
 ]},
 { trait: "team_player", tokens: [
 "team player", "cooperative", "collaborator", "works well with others",
 "loves group work", "team work",
 "يحب التعاون", "تعاوني", "يحب يشتغل مع غيره", "يحب الفريق",
 ]},

 // --- Emotional ---
 { trait: "anxious", tokens: [
 "anxious", "nervous", "worried", "worrier", "fearful", "scared",
 "afraid", "phobic", "panic", "stressed",
 "خواف", "خوافه", "قلقان", "قلقانه", "متردد", "متردده", "خايف", "خايفه",
 "يخاف", "تخاف", "متوتر", "متوتره",
 ]},
 { trait: "confident", tokens: [
 "confident", "bold", "fearless", "self-assured", "brave", "courageous",
 "واثق", "واثقه", "جريء", "جريئه", "شجاع", "شجاعه", "ما يخاف",
 ]},
 { trait: "sensitive", tokens: [
 "sensitive", "emotional", "cries easily", "takes things personally",
 "gets upset easily", "feelings hurt easily",
 "حساس", "حساسه", "يزعل بسرعه", "تزعل بسرعه", "يبكي بسرعه",
 "مشاعره مرهفه", "رقيق",
 ]},
 { trait: "sensory_sensitive", tokens: [
 "sensory sensitive", "sensitive to noise", "sensitive to sound", "overwhelmed by crowds",
 "easily overstimulated", "sensory issues",
 "حساس للاصوات", "مايتحمل الزحمه", "حساسيه حسيه",
 ]},
 { trait: "sensory_seeking", tokens: [
 "sensory seeking", "craves movement", "needs deep pressure", "stims", "stimming",
 "يحب الحركه القويه", "يبحث عن محفزات",
 ]},
 { trait: "transition_sensitive", tokens: [
 "hard with transitions", "transition issues", "melts down when switching tasks",
 "routine breaks upset them", "needs warning before changes",
 "صعب عليه التغيير", "مايحب يغير النشاط", "يتوتر لما يغيرون له الروتين",
 ]},
 { trait: "stubborn", tokens: [
 "stubborn", "strong-willed", "strong willed", "defiant", "won't listen",
 "doesn't listen", "hard headed", "hard-headed", "determined", "persistent",
 "عنيد", "عنيده", "راسه يابس", "ما يسمع كلام", "مايسمع كلام",
 "عنيده", "3aneed", "3anid",
 ]},
 { trait: "angry", tokens: [
 "angry", "aggressive", "has tantrums", "short temper", "gets angry",
 "hits others", "violent sometimes", "explosive",
 "عصبي", "عصبيه", "يزعل", "سريع الغضب", "يعصب", "يضرب",
 ]},
 { trait: "impulsive", tokens: [
 "impulsive", "acts without thinking", "blurts out", "no filter", "rash",
 "اندفاعي", "اندفاعيه", "مايفكر قبل مايسوي", "سريع بدون تفكير",
 ]},
 { trait: "oppositional", tokens: [
 "oppositional", "argues back", "always says no", "defies rules", "non-compliant",
 "يعارض", "مايسمع", "عنيد بالكلام", "يتحدى",
 ]},
 { trait: "cheerful", tokens: [
 "happy", "cheerful", "joyful", "always smiling", "positive", "optimistic",
 "bubbly", "fun", "playful",
 "سعيد", "مرح", "مرحه", "فرحان", "يضحك", "مبتسم", "ايجابي",
 ]},
 { trait: "mature", tokens: [
 "mature", "acts older", "responsible", "grown up", "wise for age",
 "ناضج", "ناضجه", "اكبر من عمره", "مسؤول", "عاقل",
 ]},
 { trait: "moody", tokens: [
 "moody", "up and down", "unpredictable mood", "mood swings",
 "مزاجي", "مزاجيه", "متقلب",
 ]},

 // --- Cognitive ---
 { trait: "gifted", tokens: [
 "gifted", "genius", "brilliant", "very smart", "super smart", "exceptionally smart",
 "talented", "advanced for age", "ahead of class", "top of class", "bright",
 "clever", "intelligent", "sharp", "sharp mind", "smart",
 "ذكي", "ذكيه", "متفوق", "متفوقه", "شاطر", "شاطره", "نابغه", "عبقري",
 "ممتاز", "اول على صفه", "متميز", "لامع", "7athi8", "thaki", "zaki",
 ]},
 { trait: "fast_learner", tokens: [
 "fast learner", "quick learner", "picks up fast", "picks things up quickly",
 "learns fast", "learns quickly", "catches on fast",
 "يتعلم بسرعه", "تتعلم بسرعه", "سريع التعلم", "سريعه التعلم",
 "يفهم بسرعه", "استيعابه سريع",
 ]},
 { trait: "poor_focus", tokens: [
 "can't focus", "cant focus", "short attention", "easily distracted",
 "doesn't focus", "doesn't pay attention", "loses focus", "distracted",
 "scattered", "unfocused", "attention issues", "can't sit still",
 "cant sit still", "adhd", "add", "attention deficit",
 "مايركز", "ما يركز", "تركيزه ضعيف", "تركيزها ضعيف", "مشتت", "مشتته",
 "ما ينتبه", "قليل التركيز", "سرحان", "فرط حركه", "تشتت انتباه",
 ]},
 { trait: "detail_oriented", tokens: [
 "detail oriented", "detail-oriented", "perfectionist", "everything has to be perfect",
 "دقيق جدا", "مهووس بالتفاصيل", "مايرضى بالغلط",
 ]},
 { trait: "focused", tokens: [
 "focused", "attentive", "pays attention", "concentrates well",
 "meticulous", "precise", "thorough", "careful",
 "orderly", "loves order", "organized", "neat", "methodical", "structured",
 "loves patterns", "patterns", "routine",
 "يركز", "تركيزه عالي", "دقيق", "دقيقه", "منتبه", "صبور في شغله",
 "منظم", "يحب النظام", "مرتب",
 ]},
 { trait: "curious", tokens: [
 "curious", "asks why", "asks questions", "always asking", "wants to know everything",
 "explorer", "inquisitive", "investigative", "loves learning", "loves to learn",
 "فضولي", "فضوليه", "يسال كثير", "تسال كثير", "يحب يعرف",
 "تحب تعرف", "يحب يكتشف", "مستكشف", "يحب التعلم",
 ]},
 { trait: "analytical", tokens: [
 "analytical", "logical", "problem solver", "thinks logically",
 "good at reasoning", "systematic",
 "تحليلي", "منطقي", "يحل مشاكل", "يفكر بمنطق",
 ]},
 { trait: "math_oriented", tokens: [
 "loves math", "math whiz", "good at math", "loves numbers",
 "mathematical", "numbers person",
 "يحب الرياضيات", "يحب الارقام", "شاطر بالحساب", "رياضي",
 ]},
 { trait: "reader", tokens: [
 "loves reading", "bookworm", "reader", "loves books", "reads a lot",
 "always reading", "devours books", "reading books", "reading",
 "يحب يقرا", "تحب تقرا", "يحب القراءه", "يحب الكتب", "قارئ",
 "القراءه", "يقرا",
 ]},
 { trait: "patient", tokens: [
 "patient", "patience", "waits well", "doesn't rush", "takes time",
 "persistent", "perseveres", "keeps trying",
 "صبور", "صبوره", "صابر", "ما يستعجل", "يتحمل",
 ]},
 { trait: "strong_memory", tokens: [
 "good memory", "strong memory", "memorizes easily", "remembers everything",
 "photographic memory", "never forgets",
 "ذاكرته قويه", "ذاكرتها قويه", "يحفظ بسرعه", "تحفظ بسرعه",
 "ذاكره قويه", "حافظ",
 ]},
 { trait: "deep_thinker", tokens: [
 "deep thinker", "thoughtful", "philosophical", "thinks deeply",
 "understanding oriented", "reflective",
 "يحب يفهم", "يفكر كثير", "عميق التفكير", "تاملي",
 ]},
 { trait: "abstract_thinker", tokens: [
 "abstract thinker", "loves theory", "big picture thinker", "conceptual",
 "يفكر تجريدي", "يحب المفاهيم", "تفكير مجرد",
 ]},
 { trait: "concrete_thinker", tokens: [
 "concrete thinker", "needs examples", "learns step by step", "literal thinker",
 "يفكر عملي", "يحب الامثله", "مايفهم بدون مثال",
 ]},
 { trait: "verbal_strength", tokens: [
 "verbal", "strong in language", "good with words", "eloquent", "talks well",
 "قوي لغويا", "لغوي", "طليق اللسان",
 ]},
 { trait: "spatial_reasoning", tokens: [
 "spatial", "good at puzzles", "visual spatial", "lego genius", "mental rotation",
 "تفكير مكاني", "شاطر بالالغاز", "ملاحظ بصري",
 ]},
 { trait: "novelty_seeking", tokens: [
 "loves new things", "bored easily", "needs variety", "novelty seeking",
 "يتملل بسرعه", "يحب الجديد", "مايحب التكرار",
 ]},
 { trait: "routine_lover", tokens: [
 "loves routine", "needs structure", "thrives on schedule", "predictable",
 "يحب الروتين", "يحب الجدول", "مايحب المفاجآت",
 ]},
 { trait: "struggling", tokens: [
 "struggling", "struggles", "behind", "below average", "weak at school",
 "needs help", "failing", "low grades", "bad grades",
 "ضعيف بالدراسه", "ضعيفه بالدراسه", "يحتاج مساعده",
 "متاخر", "درجاته ضعيفه", "مستواه ضعيف",
 ]},
 { trait: "needs_confidence", tokens: [
 "lacks confidence", "no confidence", "low self-esteem", "insecure",
 "doesn't believe in himself", "needs encouragement", "needs confidence",
 "needs motivation", "needs push", "unsure of himself",
 "ما يثق بنفسه", "ما تثق بنفسها", "يحتاج تشجيع", "تحتاج تشجيع",
 "ثقته بنفسه ضعيفه", "مايثق بنفسه",
 ]},
 { trait: "average", tokens: [
 "average", "normal", "regular", "ordinary", "typical",
 "عادي", "عاديه", "متوسط", "طبيعي",
 ]},

 // --- Creativity & Expression ---
 { trait: "creative", tokens: [
 "creative", "innovator", "inventive", "creates things", "maker",
 "builds things", "invents", "design",
 "ابداعي", "مبدع", "مبدعه", "يحب يبتكر", "يخترع", "يبدع",
 "تحب التصميم", "يحب التصميم", "التصميم",
 ]},
 { trait: "artistic", tokens: [
 "artistic", "loves drawing", "draws", "paints", "loves art",
 "good at art", "sketches", "doodler",
 "يحب الرسم", "يرسم", "ترسم", "فنان", "فنانه", "يحب الفن",
 ]},
 { trait: "imaginative", tokens: [
 "imaginative", "dreamer", "fantasy", "makes up stories",
 "lives in their own world", "imaginary friends", "vivid imagination",
 "خيالي", "خياليه", "يتخيل", "حالم", "خياله واسع",
 ]},
 { trait: "storyteller", tokens: [
 "storyteller", "loves stories", "tells stories", "writes stories",
 "narrative", "loves writing",
 "يحب القصص", "يالف قصص", "راوي", "يحب يكتب",
 ]},
 { trait: "musical", tokens: [
 "musical", "loves music", "sings", "rhythmic", "plays instrument",
 "يحب الموسيقى", "يغني", "موسيقي",
 ]},

 // --- Interests & Passions ---
 { trait: "loves_games", tokens: [
 "loves games", "loves gaming", "gamer", "plays games all day",
 "always gaming", "addicted to games", "minecraft", "roblox", "fortnite",
 "plays video games", "loves video games", "screen addict",
 "build games", "build a game", "make games", "make a game", "create games",
 "wants to build games", "wants games",
 "يحب الالعاب", "بيحب الالعاب", "قيمر", "يلعب طول الوقت", "يلعب العاب",
 "ماينكرافت", "روبلوكس", "فورتنايت", "مدمن العاب",
 "يبني العاب", "يسوي العاب", "يصنع العاب",
 ]},
 { trait: "tech_oriented", tokens: [
 "tech savvy", "tech-savvy", "loves technology", "loves computers",
 "loves ipad", "loves tablet", "loves phone", "always on screen",
 "in tech", "career in tech", "web design", "web development",
 "interested in ai", "interested in tech", "interested in computer",
 "يحب التكنولوجيا", "يحب الكمبيوتر", "بيحب الكمبيوتر", "يحب الايباد", "يحب الجوال",
 "يحب التقنيه", "تقني", "تحب التصميم", "يحب التصميم",
 "تحب التكنولوجيا", "الكمبيوتر", "كمبيوتر",
 ]},
 { trait: "hands_on", tokens: [
 "hands on", "hands-on", "loves building", "builder", "maker",
 "loves lego", "lego", "loves assembling", "tinkers", "takes things apart",
 "loves making things", "diy", "building robots", "building things",
 "making things", "interested in building", "interested in robot",
 "يحب يسوي اشياء", "يحب يركب", "يحب الليقو", "يحب التركيب",
 "يفك ويركب", "يحب الاشغال اليدويه", "يحب يبني",
 ]},
 { trait: "science_oriented", tokens: [
 "loves science", "science lover", "loves experiments", "scientist",
 "loves chemistry", "loves physics", "loves biology",
 "يحب العلوم", "يحب التجارب", "عالم صغير", "يحب الفيزياء",
 ]},
 { trait: "sporty", tokens: [
 "sporty", "athletic", "loves sports", "active in sports", "plays football",
 "plays soccer", "swimmer", "runner",
 "يحب الرياضه", "يلعب كوره", "سباح", "رياضي بدني",
 ]},
 { trait: "religious", tokens: [
 "religious", "spiritual", "loves arabic", "loves mosque", "goes to mosque",
 "loves arabic", "memorizes poetry", "arabic culture",
 "arabic recitation", "arabic memorization", "learning arabic",
 "learn arabic", "listening to arabic", "start arabic",
 "متدين", "يحب القران", "تحب القران", "يحب المسجد", "يصلي",
 "حافظ", "يحب الصلاه", "ديني", "يسمع القران", "تسمع القران",
 "يتعلم القران", "تتعلم القران",
 ]},
 { trait: "competitive", tokens: [
 "competitive", "loves winning", "hates losing", "always wants to win",
 "loves competition", "loves challenges", "competition", "contest",
 "olympiad", "wants to compete",
 "يحب التحدي", "تنافسي", "يحب يفوز", "يحب المنافسه",
 "يكره يخسر", "يحب التنافس", "مسابقات",
 ]},
 { trait: "ambitious", tokens: [
 "ambitious", "wants a career", "career", "future goals", "driven",
 "wants to be", "dreams of", "aspires",
 "طموح", "طموحه", "يبي يصير", "تبي تصير", "مستقبل",
 "يحلم", "عنده طموح",
 ]},
 { trait: "mechanical", tokens: [
 "loves machines", "mechanical", "loves cars", "loves engines",
 "takes things apart", "engineer type",
 "يحب السيارات", "يحب الالات", "ميكانيكي", "يحب المحركات",
 ]},
 { trait: "nature_oriented", tokens: [
 "loves nature", "outdoorsy", "nature lover", "loves animals",
 "loves plants", "gardener",
 "يحب الطبيعه", "يحب الحيوانات",
 ]},

 // --- Learning style hints ---
 { trait: "visual_learner", tokens: [
 "visual learner", "learns by seeing", "learns by watching", "loves videos",
 "loves youtube", "watches tutorials",
 "بصري", "يتعلم بالصور", "يحب الفيديوهات", "يحب يوتيوب",
 ]},
 { trait: "auditory_learner", tokens: [
 "auditory learner", "learns by listening", "loves audiobooks",
 "سمعي", "يتعلم بالسمع", "يحب يسمع",
 ]},
 { trait: "kinesthetic_learner", tokens: [
 "kinesthetic", "learns by doing", "hands on learner",
 "حركي", "يتعلم بالعمل", "يتعلم بالتجربه",
 ]},
 { trait: "observational_learner", tokens: [
 "learns by watching", "watches first", "mimics", "copycat learner", "modeling",
 "يتعلم بالمشاهده", "يشوف ويتعلم", "ينسخ الحركه",
 ]},
 { trait: "performance_oriented", tokens: [
 "performance oriented", "wants to show off", "loves presenting", "wants applause",
 "يحب العرض", "يحب يتفاخر", "يحب يكون الاول بالعرض",
 ]},
 { trait: "mastery_oriented", tokens: [
 "mastery oriented", "wants to master", "deep practice", "perfectionist learner",
 "يحب يتقن", "مايرضى الا يفهم كويس", "ممارسه عميقه",
 ]},
 { trait: "independent_study", tokens: [
 "independent learner", "self directed", "studies alone", "self paced",
 "مستقل", "يتعلم لحاله", "ذاتي التعلم",
 ]},
 { trait: "help_seeking", tokens: [
 "asks for help", "needs guidance", "teacher's pet", "raises hand",
 "يسال المعلم", "يحتاج توجيه", "مايستحي يسال",
 ]},
 { trait: "gamer", tokens: [
 "gamer", "plays a lot of games", "gaming kid",
 "قيمر", "لاعب العاب",
 ]},
];

function extractAdjectives(text) {
 const normalized = normalizeText(text);
 const lower = text.toLowerCase();
 const found = new Set();

 for (const entry of ADJECTIVE_DICTIONARY) {
 for (const token of entry.tokens) {
 if (normalized.includes(token) || lower.includes(token)) {
 found.add(entry.trait);
 break;
 }
 }
 }

 return [...found];
}

// ── INTEREST EXTRACTION ─────────────────────────────────────

const INTEREST_KEYWORDS = {
 coding: ["coding", "code", "برمجه", "يبرمج", "programming", "program"],
 programming: ["programming", "developer", "مبرمج", "تطوير"],
 robots: ["robot", "robots", "robotics", "روبوت", "روبوتات", "الروبوت"],
 games: ["games", "gaming", "game", "العاب", "قيم", "لعب", "minecraft", "ماينكرافت", "roblox", "روبلوكس", "fortnite", "فورتنايت"],
 arabic: ["arabic", "qur'an", "القران", "قران", "تعبير", "arabic expression", "حفظ", "تلاوه", "arabic writing", "recitation", "memoriz"],
 arabic: ["arabic", "عربي", "العربيه", "قراءه عربي", "كتابه عربي", "قواعد", "نحو"],
 science: ["science", "علوم", "تجارب", "فيزياء", "كيمياء", "physics", "chemistry", "biology"],
 math: ["math", "maths", "mathematics", "رياضيات", "حساب", "ارقام"],
 drawing: ["drawing", "draw", "رسم", "يرسم", "sketch", "paint"],
 art: ["loves art", "artistic", "art class", "فن", "فنون"],
 sports: ["sport", "sports", "رياضه", "كوره", "football", "soccer", "swimming"],
 building: ["building", "build", "بناء", "يبني", "تركيب", "lego", "ليقو"],
 electronics: ["electronics", "electronic", "الكترونيات", "كهرباء", "circuits"],
 computers: ["computer", "computers", "كمبيوتر", "حاسوب", "لابتوب", "laptop", "ipad", "ايباد"],
 technology: ["technology", "tech", "تكنولوجيا", "تقنيه"],
 web: ["web", "website", "موقع", "مواقع", "html", "css"],
 design: ["design", "تصميم", "يصمم"],
 animation: ["animation", "animate", "رسوم متحركه"],
 ai: ["ai", "artificial intelligence", "ذكاء اصطناعي", "machine learning"],
};

function extractInterests(text) {
 const normalized = normalizeText(text);
 const lower = text.toLowerCase();
 const found = new Set();

 for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
 for (const kw of keywords) {
 if (normalized.includes(kw) || lower.includes(kw)) {
 found.add(interest);
 break;
 }
 }
 }

 return [...found];
}

// ── EXPERIENCE LEVEL EXTRACTION ─────────────────────────────

function extractExperienceLevel(text) {
 const t = normalizeText(text);
 const lower = text.toLowerCase();

 const advanced = [
 "advanced", "expert", "builds apps", "years of experience", "competitions",
 "متقدم", "خبير", "يبني تطبيقات", "مسابقات",
 ];
 const intermediate = [
 "intermediate", "some experience", "been coding", "comfortable", "knows well",
 "متوسط", "عنده خبره", "يعرف برمجه",
 ];
 const beginner = [
 "beginner", "knows basics", "tried scratch", "some scratch", "a little",
 "مبتدئ", "يعرف الاساسيات", "جرب سكراتش", "جرب شوي", "خلفيه بسيطه",
 ];
 const none = [
 "never tried", "never coded", "first time", "no experience", "brand new",
 "never programmed", "complete beginner", "zero experience",
 "ما جرب", "اول مره", "ما عنده خبره", "ابدا ما جرب", "ماله خلفيه",
 ];

 for (const kw of advanced) { if (t.includes(kw) || lower.includes(kw)) return "advanced"; }
 for (const kw of intermediate) { if (t.includes(kw) || lower.includes(kw)) return "intermediate"; }
 for (const kw of beginner) { if (t.includes(kw) || lower.includes(kw)) return "beginner"; }
 for (const kw of none) { if (t.includes(kw) || lower.includes(kw)) return "none"; }

 return null;
}

// ── PARENT GOALS EXTRACTION ─────────────────────────────────

const GOAL_PATTERNS = [
 { goal: "learn_coding", patterns: ["learn cod", "learn program", "يتعلم برمج", "تتعلم برمج", "يبي يبرمج", "wants to code", "wants to program"] },
 { goal: "memorize_arabic", patterns: ["memorize arabic", "arabic writing", "حفظ القران", "يحفظ قران", "تحفظ قران"] },
 { goal: "learn_arabic", patterns: ["learn arabic", "arabic recit", "يتعلم القران", "تلاوه", "تعبير"] },
 { goal: "build_confidence", patterns: ["build confidence", "self-esteem", "self esteem", "يثق بنفسه", "تشجيع", "ثقه بالنفس"] },
 { goal: "channel_energy", patterns: ["channel energy", "burn energy", "keep busy", "يشتغل", "يتشاغل", "يفرغ طاقته"] },
 { goal: "productive_screen", patterns: ["screen time", "productive", "وقت الشاشه", "يستفيد من وقته"] },
 { goal: "competitions", patterns: ["competition", "compete", "contest", "olympiad", "مسابق", "يتنافس", "اولمبياد"] },
 { goal: "improve_focus", patterns: ["improve focus", "focus better", "attention", "يركز", "يتحسن تركيزه"] },
 { goal: "social_skills", patterns: ["social skills", "make friends", "مهارات اجتماعيه", "اصدقاء"] },
 { goal: "career_prep", patterns: ["career", "future job", "university", "مستقبل", "وظيفه", "جامعه"] },
 { goal: "improve_arabic", patterns: ["improve arabic", "learn arabic", "arabic better", "يتحسن عربي", "يتعلم عربي"] },
 { goal: "develop_thinking", patterns: ["think", "problem solv", "critical", "تفكير", "حل مشاكل"] },
 { goal: "find_hobby", patterns: ["hobby", "something to do", "after school", "هوايه", "نشاط", "بعد المدرسه"] },
 { goal: "build_games", patterns: ["build game", "make game", "create game", "يسوي لعب", "يبني لعب", "يصنع العاب"] },
 { goal: "build_websites", patterns: ["build website", "make website", "create website", "يسوي موقع", "يبني موقع"] },
 { goal: "build_robots", patterns: ["build robot", "make robot", "يسوي روبوت", "يبني روبوت"] },
];

function extractGoals(text) {
 const normalized = normalizeText(text);
 const lower = text.toLowerCase();
 const found = [];

 for (const { goal, patterns } of GOAL_PATTERNS) {
 for (const p of patterns) {
 if (normalized.includes(p) || lower.includes(p)) {
 found.push(goal);
 break;
 }
 }
 }

 return found;
}

// ── SPECIAL NEEDS DETECTION ─────────────────────────────────

function extractSpecialNeeds(text) {
 const t = normalizeText(text);
 const lower = text.toLowerCase();

 const checks = [
 { label: "ADHD", patterns: ["adhd", "add", "فرط حركه", "تشتت انتباه", "attention deficit", "فرط الحركه"] },
 { label: "autism/ASD", patterns: ["autism", "autistic", "asd", "spectrum", "توحد", "طيف التوحد", "طيف"] },
 { label: "dyslexia", patterns: ["dyslexia", "dyslexic", "عسر قراءه", "صعوبه قراءه"] },
 { label: "speech_delay", patterns: ["speech delay", "late talker", "تاخر نطق", "تاخر كلام"] },
 { label: "learning_disability", patterns: ["learning disab", "learning difficult", "صعوبات تعلم", "صعوبه تعلم"] },
 { label: "anxiety_disorder", patterns: ["anxiety disorder", "ocd", "اضطراب قلق"] },
 { label: "sensory_processing", patterns: ["sensory", "sensory processing", "حسي"] },
 ];

 for (const { label, patterns } of checks) {
 for (const p of patterns) {
 if (t.includes(p) || lower.includes(p)) return label;
 }
 }

 return null;
}

// ── INFERRED DIMENSIONS ─────────────────────────────────────

function inferLearningStyle(adjectives) {
 if (adjectives.includes("visual_learner") || adjectives.includes("artistic") || adjectives.includes("observational_learner") || adjectives.includes("spatial_reasoning")) return "visual";
 if (adjectives.includes("auditory_learner") || adjectives.includes("musical")) return "auditory";
 if (adjectives.includes("kinesthetic_learner") || adjectives.includes("hyperactive") || adjectives.includes("hands_on") || adjectives.includes("sporty") || adjectives.includes("sensory_seeking")) return "kinesthetic";
 if (adjectives.includes("reader") || adjectives.includes("storyteller") || adjectives.includes("verbal_strength")) return "reading_writing";
 return null;
}

function inferEnergyLevel(adjectives) {
 const high = ["hyperactive", "sporty", "restless", "cheerful", "impulsive", "active", "sensory_seeking"];
 const low = ["calm", "shy", "sedentary", "introverted", "anxious", "sensory_sensitive"];
 if (adjectives.some((a) => high.includes(a))) return "high";
 if (adjectives.some((a) => low.includes(a))) return "low";
 return "medium";
}

function inferSocialPreference(adjectives) {
 if (adjectives.includes("introverted") || adjectives.includes("shy") || adjectives.includes("anxious")) return "individual";
 if (adjectives.includes("social") || adjectives.includes("leader") || adjectives.includes("team_player")) return "large_group";
 return null;
}

function inferMotivationType(adjectives) {
 if (adjectives.includes("mastery_oriented") || adjectives.includes("curious") || adjectives.includes("deep_thinker") || adjectives.includes("creative")) return "intrinsic";
 if (adjectives.includes("performance_oriented") || adjectives.includes("competitive") || adjectives.includes("ambitious")) return "extrinsic";
 if (adjectives.includes("social") || adjectives.includes("team_player")) return "social";
 return null;
}

// ── MAIN PARSER ─────────────────────────────────────────────

function parseChildProfile(text, locale) {
 const adjectives = extractAdjectives(text);
 const age = extractAge(text);
 const special_needs = extractSpecialNeeds(text);

 return enrichProfileWithEvidenceContext({
 age,
 gender: coerceGender(extractGender(text)),
 adjectives,
 interests: extractInterests(text),
 experience_level: extractExperienceLevel(text),
 parent_goals: extractGoals(text),
 language: detectLanguage(text),
 special_needs,
 learning_style: inferLearningStyle(adjectives),
 energy_level: inferEnergyLevel(adjectives),
 social_preference: inferSocialPreference(adjectives),
 motivation_type: inferMotivationType(adjectives),
 });
}

// ============================================================
// RECOMMENDATION ENGINE — Weighted scoring based on
// 12 child development frameworks
// ============================================================

const TRAIT_COURSE_SCORES = {
 hyperactive: { "robot-basics": 10, "robot-advanced": 8, scratch: 9, gamedev: 7 },
 active: { "robot-basics": 8, "robot-advanced": 6, scratch: 7, gamedev: 5 },
 restless: { "robot-basics": 9, scratch: 8, gamedev: 6 },
 poor_focus: { "robot-basics": 9, scratch: 10, gamedev: 5 },
 calm: { python: 6, "algo-intro": 6, "arabic-memorization": 7, "arabic-grammar": 6 },
 sedentary: { python: 6, "arabic-memorization": 5, webdev: 5 },
 shy: { python: 8, "algo-intro": 7, "arabic-memorization": 8, "arabic-reading": 7 },
 anxious: { scratch: 8, "arabic-reading": 7, "arabic-recitation": 7 },
 introverted: { python: 8, "algo-intro": 7, "algo-competitive": 6, "arabic-memorization": 7 },
 social: { "robot-basics": 8, "robot-advanced": 7, gamedev: 7, "arabic-recitation": 6 },
 leader: { "robot-advanced": 8, gamedev: 7, "robot-basics": 6 },
 team_player: { "robot-basics": 8, "robot-advanced": 7, gamedev: 6 },
 confident: { "algo-competitive": 8, "robot-advanced": 7, webdev: 6 },
 sensitive: { scratch: 7, "arabic-recitation": 7, "arabic-reading": 6 },
 stubborn: { gamedev: 8, scratch: 7, "robot-basics": 6 },
 angry: { "robot-basics": 6, scratch: 5, gamedev: 5 },
 cheerful: { "robot-basics": 5, gamedev: 5, scratch: 5 },
 moody: { scratch: 5, gamedev: 4 },
 mature: { webdev: 8, "algo-competitive": 7, "robot-advanced": 7 },
 creative: { scratch: 9, gamedev: 10, webdev: 7 },
 artistic: { scratch: 9, gamedev: 8, webdev: 7 },
 imaginative: { scratch: 8, gamedev: 9, webdev: 6 },
 storyteller: { scratch: 8, "arabic-grammar": 6, gamedev: 5 },
 musical: { "arabic-recitation": 7, scratch: 4 },
 competitive: { "algo-competitive": 10, "algo-intro": 7, "robot-advanced": 8 },
 ambitious: { "algo-competitive": 9, webdev: 7, "robot-advanced": 8 },
 gifted: { "algo-competitive": 9, "robot-advanced": 8, webdev: 7, python: 5 },
 fast_learner: { "algo-competitive": 8, "robot-advanced": 7, webdev: 6, "arabic-reading": 6, python: 6 },
 curious: { "robot-basics": 8, python: 7, "algo-intro": 8, "robot-advanced": 6 },
 analytical: { "algo-intro": 9, "algo-competitive": 10, python: 8 },
 math_oriented: { "algo-intro": 9, "algo-competitive": 10, python: 7 },
 reader: { "arabic-reading": 12, "arabic-grammar": 8, python: 7, "algo-intro": 6 },
 strong_memory: { "arabic-memorization": 10, "arabic-recitation": 7, "algo-competitive": 5 },
 deep_thinker: { "algo-intro": 8, "algo-competitive": 7, python: 7 },
 focused: { "arabic-memorization": 9, "algo-competitive": 8, "arabic-grammar": 7, webdev: 7 },
 patient: { "arabic-memorization": 9, "algo-competitive": 7, "arabic-grammar": 8 },
 detail_oriented: { "algo-competitive": 8, webdev: 7, "arabic-grammar": 7 },
 struggling: { scratch: 9, "arabic-recitation": 6, "arabic-reading": 6 },
 needs_confidence: { scratch: 9, "arabic-recitation": 7, "arabic-reading": 7 },
 average: { scratch: 4, "robot-basics": 4, "arabic-recitation": 4, "arabic-reading": 4 },
 loves_games: { gamedev: 10, scratch: 8, python: 6 },
 gamer: { gamedev: 10, scratch: 7, python: 5 },
 tech_oriented: { gamedev: 7, python: 7, webdev: 8, scratch: 5 },
 hands_on: { "robot-basics": 10, "robot-advanced": 9, scratch: 6 },
 mechanical: { "robot-basics": 10, "robot-advanced": 10 },
 science_oriented: { "robot-basics": 8, "robot-advanced": 7, python: 6, "algo-intro": 5 },
 sporty: { "robot-basics": 7, "robot-advanced": 6 },
 religious: { "arabic-recitation": 10, "arabic-memorization": 10, "arabic-reading": 7, "arabic-grammar": 6 },
 nature_oriented: { "robot-basics": 5, python: 4 },
 visual_learner: { scratch: 9, gamedev: 8, webdev: 7, "robot-basics": 5 },
 auditory_learner: { "arabic-recitation": 9, "arabic-reading": 7 },
 kinesthetic_learner: { "robot-basics": 10, "robot-advanced": 8, scratch: 6 },
 impulsive: { scratch: 9, "robot-basics": 9, gamedev: 6, "arabic-recitation": 4 },
 oppositional: { gamedev: 8, scratch: 8, "robot-basics": 6 },
 sensory_sensitive: { scratch: 8, "arabic-recitation": 7, "arabic-reading": 7, python: 5 },
 sensory_seeking: { "robot-basics": 10, "robot-advanced": 8, scratch: 7 },
 transition_sensitive: { scratch: 8, "arabic-reading": 6, "arabic-recitation": 6 },
 abstract_thinker: { "algo-competitive": 9, "algo-intro": 9, webdev: 8, python: 7 },
 concrete_thinker: { scratch: 9, "robot-basics": 9, "arabic-reading": 7 },
 verbal_strength: { "arabic-grammar": 9, python: 7, "algo-intro": 6, "arabic-recitation": 6 },
 spatial_reasoning: { "robot-advanced": 9, gamedev: 8, scratch: 7, "robot-basics": 8 },
 novelty_seeking: { gamedev: 8, scratch: 8, python: 6 },
 routine_lover: { "arabic-memorization": 9, "arabic-grammar": 8, "algo-intro": 6 },
 observational_learner: { scratch: 9, gamedev: 7, webdev: 6 },
 performance_oriented: { "algo-competitive": 9, gamedev: 8, "robot-advanced": 6 },
 mastery_oriented: { "algo-intro": 9, "arabic-memorization": 8, python: 8 },
 independent_study: { python: 9, "algo-intro": 8, webdev: 7 },
 help_seeking: { scratch: 8, "arabic-reading": 7, "arabic-recitation": 7 },
};

const INTEREST_COURSE_MAP = {
 coding: ["scratch", "python", "webdev", "gamedev"],
 programming: ["scratch", "python", "webdev", "gamedev"],
 robots: ["robot-basics", "robot-advanced"],
 games: ["gamedev", "scratch"],
 arabic: ["arabic-recitation", "arabic-memorization"],
 arabic: ["arabic-reading", "arabic-grammar"],
 science: ["robot-basics", "robot-advanced", "python"],
 math: ["algo-intro", "algo-competitive", "python"],
 drawing: ["scratch", "gamedev", "webdev"],
 art: ["scratch", "gamedev", "webdev"],
 building: ["robot-basics", "robot-advanced"],
 electronics: ["robot-basics", "robot-advanced"],
 computers: ["python", "scratch", "webdev"],
 technology: ["python", "webdev", "gamedev"],
 web: ["webdev"],
 design: ["webdev", "gamedev"],
 animation: ["scratch", "gamedev"],
 ai: ["python", "robot-advanced"],
 sports: ["robot-basics"],
};

function scoreCourses(profile, courses) {
 return courses.map((course) => {
 let score = 0;

 // ── AGE FIT (critical, weighted heavily) ──
 if (profile.age) {
 if (profile.age >= course.ageMin && profile.age <= course.ageMax) {
 score += 15;
 } else if (profile.age >= course.ageMin - 1 && profile.age <= course.ageMax + 1) {
 score += 5;
 // Gifted/fast learners can stretch upward
 if (profile.adjectives.some((a) => ["gifted", "fast_learner", "mature"].includes(a)) && profile.age < course.ageMin) {
 score += 6;
 }
 } else {
 score -= 25;
 }
 }

 // ── TRAIT SCORING ──
 for (const adj of profile.adjectives) {
 const cs = TRAIT_COURSE_SCORES[adj];
 if (cs && cs[course.slug]) score += cs[course.slug];
 }

 // ── INTEREST SCORING ──
 for (const interest of profile.interests) {
 const slugs = INTEREST_COURSE_MAP[interest] || [];
 if (slugs.includes(course.slug)) score += 10;
 // Fuzzy match
 if (course.category.includes(interest) || interest.includes(course.category)) {
 score += 5;
 }
 }

 // ── EXPERIENCE LEVEL ──
 if (profile.experience_level) {
 const map = { none: "beginner", beginner: "beginner", intermediate: "intermediate", advanced: "advanced" };
 if (course.level === map[profile.experience_level]) score += 4;
 // Gifted beginners can jump to intermediate
 if (profile.adjectives.includes("gifted") && map[profile.experience_level] === "beginner" && course.level === "intermediate") {
 score += 2;
 }
 }

 // ── LEARNING STYLE BONUS ──
 if (profile.learning_style === "kinesthetic" && course.category === "robotics") score += 5;
 if (profile.learning_style === "visual" && course.category === "programming") score += 3;
 if (profile.learning_style === "auditory" && ["arabic", "arabic"].includes(course.category)) score += 5;
 if (profile.learning_style === "reading_writing" && ["algorithms", "arabic"].includes(course.category)) score += 3;

 // ── ENERGY LEVEL ──
 if (profile.energy_level === "high" && course.category === "robotics") score += 4;
 if (profile.energy_level === "low" && ["arabic", "arabic", "algorithms"].includes(course.category)) score += 3;

 // ── SPECIAL NEEDS ADJUSTMENTS ──
 if (profile.special_needs) {
 if (profile.special_needs.includes("ADHD")) {
 if (["robot-basics", "scratch"].includes(course.slug)) score += 6;
 if (course.level === "advanced") score -= 4;
 }
 if (profile.special_needs.includes("autism")) {
 if (["python", "algo-intro", "robot-basics"].includes(course.slug)) score += 5;
 }
 if (profile.special_needs.includes("dyslexia")) {
 if (["scratch", "robot-basics", "arabic-recitation"].includes(course.slug)) score += 6;
 if (["python", "webdev"].includes(course.slug)) score -= 3;
 }
 }

 // ── PENALTY: anxious/struggling + advanced courses ──
 if (profile.adjectives.includes("needs_confidence") && course.level === "advanced") score -= 8;
 if (profile.adjectives.includes("anxious") && course.level === "advanced") score -= 6;
 if (profile.adjectives.includes("struggling") && course.level === "advanced") score -= 10;

 score += evidenceScoringDelta(profile, course);

 return { slug: course.slug, score };
 });
}

// ============================================================
// MESSAGE GENERATOR — Pure template-based, no AI needed
// ============================================================

const TRAIT_EXPLANATIONS_EN = {
 hyperactive: "Since your child has lots of energy, hands-on activities with immediate feedback work best",
 shy: "For a quieter child, individual-paced learning builds confidence without social pressure",
 creative: "Your child's creativity will shine through designing and building their own projects",
 competitive: "A child who loves challenges thrives with measurable progress and competition tracks",
 curious: "Curiosity is a superpower — courses that let them explore 'how things work' are perfect",
 gifted: "Advanced children need real challenges to stay engaged and reach their potential",
 loves_games: "Channeling their gaming passion into game creation is the most motivating path",
 religious: "Nurturing their spiritual connection through structured learning strengthens both faith and discipline",
 hands_on: "Children who love building things learn best through physical, tactile activities",
 anxious: "Starting with supportive, low-pressure courses helps build a safe foundation for growth",
 needs_confidence: "Beginning with high-success-rate activities builds the confidence they need to tackle bigger challenges",
 struggling: "Visual, interactive courses with instant results help struggling children experience success early",
 focused: "A patient, focused child can excel in courses that reward deep, sustained effort",
 analytical: "Their logical thinking is perfectly suited for problem-solving and algorithmic challenges",
 tech_oriented: "Turning their screen time into productive creation skills is a powerful transformation",
 social: "Group-based courses let social learners thrive through collaboration and team projects",
 artistic: "Visual and design-focused courses give artistic children a creative outlet through technology",
 stubborn: "Strong-willed children do best when given autonomy to choose their own projects",
 fast_learner: "Quick learners benefit from courses that progressively increase in complexity",
 math_oriented: "A natural affinity for numbers translates perfectly into computational thinking",
 strong_memory: "A strong memory is the foundation for structured memorization programs",
 patient: "Patient children excel in long-form mastery courses that reward persistence",
 sporty: "Active children enjoy robotics where they can move, build, and test physical creations",
 mechanical: "A love for machines and assembly makes robotics courses a natural fit",
 science_oriented: "Their passion for science finds a perfect home in hands-on tech experiments",
 musical: "Rhythmic and melodic learning approaches make recitation courses especially engaging",
};

const TRAIT_EXPLANATIONS_AR = {
 hyperactive: "بما أن طفلك كثير الحركة، الأنشطة العملية مع نتائج فورية هي الأنسب له",
 shy: "للأطفال الهادئين، التعلم الذاتي يبني الثقة بدون ضغط اجتماعي",
 creative: "إبداع طفلك سيتألق من خلال تصميم وبناء مشاريعه الخاصة",
 competitive: "الطفل الذي يحب التحدي ينجح في المسارات التنافسية مع تقدم قابل للقياس",
 curious: "الفضول قوة عظمى — الدورات التي تتيح الاستكشاف مثالية لطفلك",
 gifted: "الأطفال المتقدمون يحتاجون تحديات حقيقية ليبقوا متحمسين",
 loves_games: "تحويل شغفه بالألعاب إلى صناعة الألعاب هو المسار الأكثر تحفيزاً",
 religious: "رعاية اتصاله الروحي من خلال التعلم المنظم يقوي الإيمان والانضباط",
 hands_on: "الأطفال الذين يحبون البناء يتعلمون أفضل من خلال الأنشطة العملية",
 anxious: "البدء بدورات داعمة ومريحة يبني أساساً آمناً للنمو",
 needs_confidence: "البدء بأنشطة نجاحها مضمون يبني الثقة اللازمة لمواجهة تحديات أكبر",
 struggling: "الدورات التفاعلية والمرئية تساعد الطفل على تجربة النجاح مبكراً",
 focused: "الطفل الصبور والمركز يتفوق في الدورات التي تكافئ الجهد المستمر",
 analytical: "تفكيره المنطقي مناسب تماماً لحل المشكلات والتحديات الخوارزمية",
 tech_oriented: "تحويل وقت الشاشة إلى مهارات إنتاجية تحول قوي",
 social: "الدورات الجماعية تتيح للمتعلم الاجتماعي النجاح من خلال التعاون",
 artistic: "الدورات البصرية والتصميمية تمنح الطفل الفنان منفذاً إبداعياً",
 stubborn: "الأطفال ذوو الإرادة القوية يبدعون حين يُمنحون حرية اختيار مشاريعهم",
 fast_learner: "المتعلمون السريعون يستفيدون من الدورات التي تزداد تعقيداً تدريجياً",
 math_oriented: "حبه للأرقام يترجم بشكل مثالي إلى التفكير البرمجي",
 strong_memory: "الذاكرة القوية هي الأساس لبرامج الحفظ المنظمة",
 patient: "الأطفال الصبورون يتفوقون في دورات الإتقان طويلة المدى",
 sporty: "الأطفال النشيطون يستمتعون بالروبوتات حيث يتحركون ويبنون ويختبرون",
 mechanical: "حب الآلات والتركيب يجعل دورات الروبوت خياراً طبيعياً",
 science_oriented: "شغفه بالعلوم يجد بيته المثالي في التجارب التقنية العملية",
 musical: "أساليب التعلم الإيقاعية واللحنية تجعل دورات القراءة جذابة بشكل خاص",
};

const COURSE_NAMES_EN = {
 scratch: "Scratch Programming", python: "Python for Kids", webdev: "Web Development",
 "robot-basics": "Robot Builders", "robot-advanced": "Advanced Robotics",
 "algo-intro": "Algorithm Adventures", "algo-competitive": "Competitive Programming",
 "arabic-reading": "Arabic Reading & Writing", "arabic-grammar": "Arabic Grammar",
 "arabic-recitation": "Arabic Reading", "arabic-memorization": "Arabic Writing",
 gamedev: "Game Development",
};

const COURSE_NAMES_AR = {
 scratch: "برمجة سكراتش", python: "بايثون للأطفال", webdev: "تطوير الويب",
 "robot-basics": "بناة الروبوتات", "robot-advanced": "روبوتات متقدمة",
 "algo-intro": "مغامرات الخوارزميات", "algo-competitive": "البرمجة التنافسية",
 "arabic-reading": "القراءة والكتابة العربية", "arabic-grammar": "قواعد اللغة العربية",
 "arabic-recitation": "قراءة العربية", "arabic-memorization": "حفظ العربية",
 gamedev: "تطوير الألعاب",
};

function generateMessage(profile, recommendedSlugs, locale) {
 const isAr = locale === "ar" || profile.language === "ar";
 const traitExplanations = isAr ? TRAIT_EXPLANATIONS_AR : TRAIT_EXPLANATIONS_EN;
 const courseNames = isAr ? COURSE_NAMES_AR : COURSE_NAMES_EN;

 if (recommendedSlugs.length === 0) {
 if (!profile.age && profile.adjectives.length === 0) {
 return isAr
 ? "مرحباً! أخبرني عن عمر طفلك وما يحب أن يفعله، وسأقترح لك أفضل الدورات المناسبة له."
 : "Hi there! Tell me your child's age and what they enjoy doing, and I'll suggest the best courses for them.";
 }
 if (!profile.age) {
 return isAr
 ? "شكراً على المعلومات! كم عمر طفلك؟ العمر يساعدني كثيراً في اختيار الدورة المناسبة."
 : "Thanks for sharing! How old is your child? Age helps me find the perfect course match.";
 }
 return isAr
 ? "أخبرني المزيد عن اهتمامات طفلك وشخصيته حتى أوصيك بالدورات الأنسب!"
 : "Tell me more about your child's interests and personality so I can recommend the best courses!";
 }

 // Build personalized message
 const parts = [];

 // Opening with age acknowledgment
 if (profile.age) {
 parts.push(
 isAr
 ? `بناءً على عمر طفلك (${profile.age} سنوات) وشخصيته`
 : `Based on your child's age (${profile.age}) and personality`
 );
 }

 // Add the most relevant trait explanation (pick first 1-2 matching traits)
 const relevantTraits = profile.adjectives.filter((a) => traitExplanations[a]);
 if (relevantTraits.length > 0) {
 parts.push(traitExplanations[relevantTraits[0]]);
 if (relevantTraits.length > 1) {
 parts.push(traitExplanations[relevantTraits[1]]);
 }
 }

 // Recommend courses by name
 const names = recommendedSlugs.map((s) => courseNames[s] || s);
 if (isAr) {
 parts.push(`أوصي بـ: ${names.join("، ")}.`);
 } else {
 parts.push(`I recommend: ${names.join(", ")}.`);
 }

 return parts.join(". ") + (parts[parts.length - 1].endsWith(".") ? "" : ".");
}

// ============================================================
// OPTIONAL: AI message enhancement (uses API only for
// making the message warmer — parsing is 100% local)
// ============================================================

async function enhanceMessageWithAI(profile, recommendedSlugs, locale, fallbackMessage) {
 // Skip remote "warm message" step for instant responses (template message only).
 if (process.env.RECOMMEND_AI_ENHANCE === "0" || process.env.RECOMMEND_FAST === "1") {
 return fallbackMessage;
 }

 const enhanceTimeoutMs = Math.max(
 1000,
 parseInt(process.env.RECOMMEND_AI_ENHANCE_TIMEOUT_MS || "6000", 10) || 6000
 );

 // Try to load AI SDKs — if not available or no keys, return fallback
 try {
 const providers = [];

 // Try Claude
 if (process.env.ANTHROPIC_API_KEY) {
 try {
 const Anthropic = require("@anthropic-ai/sdk");
 providers.push({
 name: "Claude",
 call: async (prompt) => {
 const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 const r = await client.messages.create({
 model: "claude-haiku-4-5-20251001", max_tokens: 400,
 system: prompt.system, messages: [{ role: "user", content: prompt.user }],
 });
 return r.content[0].type === "text" ? r.content[0].text : null;
 },
 });
 } catch {}
 }

 // Try OpenAI
 if (process.env.OPENAI_API_KEY) {
 try {
 const OpenAI = require("openai").default;
 providers.push({
 name: "OpenAI",
 call: async (prompt) => {
 const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 const r = await client.chat.completions.create({
 model: "gpt-4o-mini", max_tokens: 400,
 messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
 });
 return r.choices[0]?.message?.content || null;
 },
 });
 } catch {}
 }

 // Try DeepSeek
 if (process.env.DEEPSEEK_API_KEY) {
 try {
 const OpenAI = require("openai").default;
 providers.push({
 name: "DeepSeek",
 call: async (prompt) => {
 const client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });
 const r = await client.chat.completions.create({
 model: "deepseek-chat", max_tokens: 400,
 messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
 });
 return r.choices[0]?.message?.content || null;
 },
 });
 } catch {}
 }

 if (providers.length === 0) return fallbackMessage;

 const lang = locale === "ar" ? "Arabic" : "English";
 const courseNames = locale === "ar" ? COURSE_NAMES_AR : COURSE_NAMES_EN;
 const names = recommendedSlugs.map((s) => courseNames[s] || s).join(", ");

 const prompt = {
 system: `You write warm, brief course recommendation messages for parents. Respond in ${lang}. 2-4 sentences max. Be specific about the child. Return ONLY the message text, no JSON.`,
 user: `Child profile: age=${profile.age}, traits=[${profile.adjectives.join(",")}], interests=[${profile.interests.join(",")}], special_needs=${profile.special_needs || "none"}.
Recommended courses: ${names}.
Write a warm, personalized message explaining why these courses fit this child. Reference their specific traits.`,
 };

 const runEnhance = async () => {
 for (const provider of providers) {
 try {
 const result = await provider.call(prompt);
 if (result && result.length > 20) return result;
 } catch (err) {
 console.error(`[AI enhance] ${provider.name} failed:`, err.message);
 }
 }
 return fallbackMessage;
 };

 const enhanced = await Promise.race([
 runEnhance(),
 new Promise((resolve) => setTimeout(() => resolve(null), enhanceTimeoutMs)),
 ]);
 if (enhanced != null) return enhanced;
 console.warn("[AI enhance] timed out; using template message");
 } catch {}

 return fallbackMessage;
}

// ============================================================
// MAIN CONTROLLER
// ============================================================

exports.recommend = async (req, res) => {
 const { message, locale = "en" } = req.body;

 if (!message || typeof message !== "string" || message.length > 2000) {
 return res.status(400).json({ error: "Invalid message. Must be a string under 2000 characters." });
 }

 try {
 let courses = await Course.find({ isActive: true }).lean();
 if (courses.length === 0) {
 await ensureDefaultCourses();
 courses = await Course.find({ isActive: true }).lean();
 }
 if (courses.length === 0) {
 return res.status(503).json({ error: "No courses available" });
 }

 // ── STEP 1: PARSE (gated: sanitize + local NLP + optional structured LLM merge) ──
 // For faster API: set PARSER_USE_LLM=0 in .env (skips OpenAI/Anthropic parse pass when keys exist).
 console.log("[Recommend] Parsing child profile (parser gate)...");
 const { parseWithGate } = require("../services/aiParserGate");
 const profile = await parseWithGate(message, locale);
 console.log("[Recommend] Profile:", JSON.stringify(profile));

 // ── STEP 2: SCORE & RANK courses ──
 const scored = scoreCourses(profile, courses);
 const topCourses = scored
 .filter((s) => s.score > 0)
 .sort((a, b) => b.score - a.score)
 .slice(0, 4);
 const recommendedSlugs = topCourses.map((s) => s.slug);

 console.log("[Recommend] Scores:", topCourses.map((s) => `${s.slug}(${s.score})`).join(", "));

 // ── STEP 3: GENERATE MESSAGE ──
 const templateMessage = generateMessage(profile, recommendedSlugs, locale);

 // Try AI enhancement (optional, non-blocking fallback)
 let finalMessage = templateMessage;
 try {
 finalMessage = await enhanceMessageWithAI(profile, recommendedSlugs, locale, templateMessage);
 } catch {
 // AI enhancement failed, use template message — totally fine
 }

 return res.json({
 ids: recommendedSlugs,
 message: finalMessage,
 profile,
 });
 } catch (error) {
 console.error("[Recommend] Error:", error);
 return res.status(500).json({ error: "Failed to get recommendation" });
 }
};

// Export for testing & LLM gate allowlists
exports._parseChildProfile = parseChildProfile;
exports._scoreCourses = scoreCourses;
exports._generateMessage = generateMessage;
exports._allowedAdjectiveList = Object.keys(TRAIT_COURSE_SCORES);
exports._allowedInterestList = Object.keys(INTEREST_COURSE_MAP);
