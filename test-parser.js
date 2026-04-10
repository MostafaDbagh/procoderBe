/**
 * Test the REAL parser + scoring engine with sample parent inputs.
 * No AI API needed — tests the full local pipeline.
 *
 * Run: node test-parser.js
 */

const { _parseChildProfile: parse, _scoreCourses: scoreCourses, _generateMessage: generateMessage } = require("./controllers/recommendController");

const courses = [
  { slug: "scratch", category: "programming", ageMin: 6, ageMax: 9, level: "beginner" },
  { slug: "python", category: "programming", ageMin: 10, ageMax: 13, level: "beginner" },
  { slug: "webdev", category: "programming", ageMin: 14, ageMax: 18, level: "intermediate" },
  { slug: "robot-basics", category: "robotics", ageMin: 8, ageMax: 12, level: "beginner" },
  { slug: "robot-advanced", category: "robotics", ageMin: 13, ageMax: 18, level: "intermediate" },
  { slug: "algo-intro", category: "algorithms", ageMin: 10, ageMax: 13, level: "beginner" },
  { slug: "algo-competitive", category: "algorithms", ageMin: 14, ageMax: 18, level: "advanced" },
  { slug: "arabic-reading", category: "arabic", ageMin: 6, ageMax: 9, level: "beginner" },
  { slug: "arabic-grammar", category: "arabic", ageMin: 10, ageMax: 14, level: "intermediate" },
  { slug: "quran-recitation", category: "quran", ageMin: 6, ageMax: 12, level: "beginner" },
  { slug: "quran-memorization", category: "quran", ageMin: 10, ageMax: 18, level: "intermediate" },
  { slug: "gamedev", category: "programming", ageMin: 12, ageMax: 16, level: "intermediate" },
];

function recommend(text) {
  const profile = parse(text, "en");
  const scored = scoreCourses(profile, courses)
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  return { profile, results: scored };
}

// ── TEST CASES ──
const tests = [
  // English inputs
  { input: "my kid is 7 years old and he is hyper active and clever, suggest me some courses", expectAge: 7, expectTraits: ["hyperactive", "gifted"], expectTop: "scratch" },
  { input: "my daughter is 14 and interested in building robots", expectAge: 14, expectTraits: ["hands_on"], expectTop: "robot-advanced" },
  { input: "I want my 12 year old to start learning Quran recitation", expectAge: 12, expectTraits: ["religious"], expectTop: "quran-recitation" },
  { input: "my son is 6, very active, ADHD diagnosed, loves Minecraft", expectAge: 6, expectTraits: ["hyperactive", "loves_games"], expectTop: "scratch" },
  { input: "my 13 year old is bored at school, very smart, wants to build games", expectAge: 13, expectTraits: ["gifted", "loves_games"], expectTop: "gamedev" },
  { input: "my 7 year old lacks confidence and struggles at school", expectAge: 7, expectTraits: ["needs_confidence", "struggling"], expectTop: "scratch" },
  { input: "my son is 10 and very social, loves working with friends, interested in robots", expectAge: 10, expectTraits: ["social", "hands_on"], expectTop: "robot-basics" },
  { input: "my 11 year old loves math and problem solving, very analytical", expectAge: 11, expectTraits: ["math_oriented", "analytical"], expectTop: "algo-intro" },
  { input: "my teenager is introverted and gifted, he codes already but wants competition", expectAge: 14, expectTraits: ["introverted", "gifted", "competitive"], expectTop: "algo-competitive" },
  { input: "my kid is 12, stubborn but very creative, loves making things, wants to build a game", expectAge: 12, expectTraits: ["stubborn", "creative", "hands_on"], expectTop: "gamedev" },
  { input: "my child is 9 with autism, loves patterns and order, interested in computers", expectAge: 9, expectTraits: ["focused"], expectTop: "scratch" },
  { input: "she's 8 and shy but loves drawing and art", expectAge: 8, expectTraits: ["shy", "artistic"], expectTop: "scratch" },
  { input: "he is 15 and loves web design, wants to build websites", expectAge: 15, expectTraits: ["tech_oriented"], expectTop: "webdev" },
  { input: "my 10 year old is curious, always asking why, loves science experiments", expectAge: 10, expectTraits: ["curious", "science_oriented"], expectTop: "robot-basics" },
  { input: "my son is 8 and hyperactive with ADHD, can't sit still for 5 minutes", expectAge: 8, expectTraits: ["hyperactive", "poor_focus"], expectTop: "robot-basics" },
  { input: "my daughter is 16 and competitive, she wants to prepare for IOI", expectAge: 16, expectTraits: ["competitive"], expectTop: "algo-competitive" },
  { input: "my child is 7 and loves games, plays Minecraft and Roblox all day", expectAge: 7, expectTraits: ["loves_games"], expectTop: "scratch" },
  { input: "my 6 year old is calm and patient, she loves listening to Quran", expectAge: 6, expectTraits: ["calm", "religious"], expectTop: "quran-recitation" },
  { input: "my 14 year old is ambitious and wants a career in tech", expectAge: 14, expectTraits: ["ambitious", "tech_oriented"], expectTop: "webdev" },
  { input: "my son is 9 years old, he is a fast learner and loves reading books", expectAge: 9, expectTraits: ["fast_learner", "reader"], expectTop: "arabic-reading" },

  // Arabic inputs
  { input: "ابني عمره ١٠ سنين وبيحب الألعاب والكمبيوتر وكثير الحركة", expectAge: 10, expectTraits: ["loves_games", "tech_oriented", "hyperactive"], expectTop: "python" },
  { input: "بنتي عمرها ٨ سنين خجولة وذكية وتحب ترسم", expectAge: 8, expectTraits: ["shy", "gifted", "artistic"], expectTop: "scratch" },
  { input: "ولدي عمره ١٥ سنة يحب التحدي وذكي ويبي يدخل مسابقات برمجة", expectAge: 15, expectTraits: ["competitive", "gifted"], expectTop: "algo-competitive" },
  { input: "ابني عمره ١١ سنة صبور ويحب القرآن وذاكرته قوية", expectAge: 11, expectTraits: ["patient", "religious", "strong_memory"], expectTop: "quran-memorization" },
  { input: "بنتي ١٦ سنة تحب التصميم والتكنولوجيا وتبي تسوي مواقع", expectAge: 16, expectTraits: ["creative", "tech_oriented"], expectTop: "webdev" },
  { input: "ابني عمره ٨ يحب العربي والقراءة", expectAge: 8, expectTraits: ["reader"], expectTop: "arabic-reading" },
  { input: "بنتي ٦ سنين هادية وتحب تسمع القرآن", expectAge: 6, expectTraits: ["calm", "religious"], expectTop: "quran-recitation" },
  { input: "ولدي ١٢ سنة عنيد بس مبدع ويحب يسوي أشياء بيده", expectAge: 12, expectTraits: ["stubborn", "creative", "hands_on"], expectTop: "gamedev" },
  { input: "طفلي عمره ٧ سنوات ما يركز وكثير الحركة", expectAge: 7, expectTraits: ["poor_focus", "hyperactive"], expectTop: "scratch" },
  { input: "بنتي عمرها ١٣ اجتماعية وتحب تشتغل مع صحباتها", expectAge: 13, expectTraits: ["social"], expectTop: "robot-advanced" },
  { input: "ابني عمره ١٠ يحب الرياضيات ويحل المسائل بسرعة", expectAge: 10, expectTraits: ["math_oriented"], expectTop: "algo-intro" },
  { input: "ولدي ٩ سنين فضولي ويسأل كثير ويحب العلوم", expectAge: 9, expectTraits: ["curious", "science_oriented"], expectTop: "robot-basics" },
  { input: "بنتي ١٤ سنة ذكية وطموحة وتبي تتعلم برمجة", expectAge: 14, expectTraits: ["gifted", "ambitious"], expectTop: "webdev" },
  { input: "ابني ١١ سنة يحب الليقو ويفك ويركب كل شيء", expectAge: 11, expectTraits: ["hands_on"], expectTop: "robot-basics" },
  { input: "طفلتي عمرها ٧ خوافة وتحتاج تشجيع", expectAge: 7, expectTraits: ["anxious", "needs_confidence"], expectTop: "scratch" },

  // Mixed / Arabizi
  { input: "3omro 7 sneen w hyper active", expectAge: 7, expectTraits: ["hyperactive"], expectTop: "scratch" },
  { input: "my son عمره 10 ويحب coding and robots", expectAge: 10, expectTraits: [], expectTop: "robot-basics" },
  { input: "benti 12 years old creative w loves games", expectAge: 12, expectTraits: ["creative", "loves_games"], expectTop: "gamedev" },
  { input: "waladi 8 years shy and smart", expectAge: 8, expectTraits: ["shy", "gifted"], expectTop: "scratch" },
  { input: "he is 15, competitive, wants olympiad preparation", expectAge: 15, expectTraits: ["competitive"], expectTop: "algo-competitive" },

  // Edge cases
  { input: "suggest something for my child", expectAge: null, expectTraits: [], expectTop: null },
  { input: "I have a first grader who loves games", expectAge: 6, expectTraits: ["loves_games"], expectTop: "scratch" },
  { input: "middle school student interested in AI and robotics", expectAge: 13, expectTraits: ["tech_oriented"], expectTop: "robot-advanced" },
  { input: "my high school son wants to learn web development", expectAge: 16, expectTraits: ["tech_oriented"], expectTop: "webdev" },
  { input: "ابني في ثاني ابتدائي ويحب يلعب ماينكرافت", expectAge: 7, expectTraits: ["loves_games"], expectTop: "scratch" },
];

// ── RUN ALL TESTS ──
console.log("=".repeat(90));
console.log("  PROCODER AI PARSER — FULL PIPELINE TEST (Parser → Scorer → Message Generator)");
console.log("  Testing", tests.length, "inputs: English, Arabic, Arabizi, mixed, edge cases");
console.log("=".repeat(90));

let passed = 0;
let failed = 0;
const failures = [];

tests.forEach((tc, i) => {
  const { profile, results } = recommend(tc.input);
  const topSlug = results.length > 0 ? results[0].slug : null;
  const topSlugs = results.map((r) => r.slug);

  // Check age
  const ageOk = profile.age === tc.expectAge;

  // Check traits (all expected traits must be present)
  const traitsOk = tc.expectTraits.every((t) => profile.adjectives.includes(t));

  // Check top recommendation
  const topOk = tc.expectTop === null
    ? results.length === 0
    : topSlugs.includes(tc.expectTop);

  const allOk = ageOk && traitsOk && topOk;
  if (allOk) passed++;
  else {
    failed++;
    failures.push(i + 1);
  }

  const status = allOk ? "PASS" : "FAIL";
  const flags = [];
  if (!ageOk) flags.push(`age: got ${profile.age} want ${tc.expectAge}`);
  if (!traitsOk) {
    const missing = tc.expectTraits.filter((t) => !profile.adjectives.includes(t));
    flags.push(`traits missing: [${missing.join(", ")}]`);
  }
  if (!topOk) flags.push(`top: got ${topSlug} want ${tc.expectTop}`);

  console.log(`\n[${String(i + 1).padStart(2, "0")}] ${status} | "${tc.input.slice(0, 75)}${tc.input.length > 75 ? "..." : ""}"`);
  console.log(`     Age: ${profile.age ?? "null"} | Gender: ${profile.gender ?? "null"} | Lang: ${profile.language} | Energy: ${profile.energy_level} | Special: ${profile.special_needs ?? "none"}`);
  console.log(`     Traits: [${profile.adjectives.join(", ")}]`);
  console.log(`     Interests: [${profile.interests.join(", ")}]`);
  console.log(`     Top 4: ${results.map((r) => `${r.slug}(${r.score})`).join(", ") || "NONE"}`);
  if (flags.length > 0) console.log(`     ✗ ${flags.join(" | ")}`);
});

// Show message generation sample
console.log("\n" + "=".repeat(90));
console.log("  MESSAGE GENERATION SAMPLES");
console.log("=".repeat(90));

const sampleInputs = [
  "my kid is 7 years old and he is hyper active and clever",
  "بنتي عمرها ٨ سنين خجولة وذكية وتحب ترسم",
  "suggest something for my child",
];

sampleInputs.forEach((input) => {
  const { profile, results } = recommend(input);
  const slugs = results.map((r) => r.slug);
  const locale = profile.language === "ar" ? "ar" : "en";
  const msg = generateMessage(profile, slugs, locale);
  console.log(`\n  Input: "${input}"`);
  console.log(`  Message: "${msg}"`);
});

console.log("\n" + "=".repeat(90));
console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
if (failures.length > 0) console.log(`  Failed: #${failures.join(", #")}`);
console.log("=".repeat(90));
