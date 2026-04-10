/**
 * Stress-test parser gate: 2000 synthetic English + 2000 Arabic parent messages (deterministic seeds).
 * Default: local NLP only (PARSER_USE_LLM=0) — no API keys required.
 *
 * Run: node scripts/parser-benchmark-1000.js
 * With LLM: PARSER_USE_LLM=1 node scripts/parser-benchmark-1000.js
 *
 * Gender accuracy (10_000 samples: 2500 × EN boy, EN girl, AR boy, AR girl):
 *   npm run test:parser:10k
 *   or: node scripts/parser-benchmark-1000.js --gender10k
 */

process.env.PARSER_USE_LLM = process.env.PARSER_USE_LLM || "0";

const { parseWithGate } = require("../services/aiParserGate");
const {
  mulberry32,
  pick,
  pickAge,
  toEasternNum,
  EN_TEMPLATES,
  AR_TEMPLATES,
} = require("./recommendPrompts");

const rndEn = mulberry32(0x9e3779b9);
const rndAr = mulberry32(0xbeefcafe);

function allDigitsWestern(s) {
  return s.replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660));
}

// Unambiguous gender cues (used for 10k boy vs girl accuracy run)
const EN_GENDER_BOY_TEMPLATES = [
  (rnd) =>
    `my son is ${pickAge(rnd)} years old and ${pick(rnd, ["loves Scratch", "is hyper active", "wants to code", "enjoys robots", "shy at school"])}`,
  (rnd) =>
    `my ${pickAge(rnd)} year old son ${pick(rnd, ["loves Minecraft", "needs confidence", "is very gifted", "likes building"])}`,
  (rnd) =>
    `he is ${pickAge(rnd)} years old and ${pick(rnd, ["he loves games", "he wants Python", "his hobby is chess"])}`,
  (rnd) =>
    `he's ${pickAge(rnd)} and ${pick(rnd, ["into competitive programming", "loves science", "calm and focused"])}`,
  (rnd) =>
    `waladi ${pickAge(rnd)} years ${pick(rnd, ["smart", "social", "introverted"])} w ${pick(rnd, ["robots", "games", "reading"])}`,
  (rnd) =>
    `I have a boy ${pickAge(rnd)} years old, ${pick(rnd, ["ADHD", "curious", "anxious"])} ${pick(rnd, ["enjoys Lego", "loves puzzles"])}`,
  (rnd) =>
    `my brother's kid is a boy, ${pickAge(rnd)} years old, ${pick(rnd, ["loves drawing", "into coding"])}`,
  (rnd) =>
    `high school boy ${pickAge(rnd)} wants ${pick(rnd, ["web dev", "game dev", "robotics"])}`,
];

const EN_GENDER_GIRL_TEMPLATES = [
  (rnd) =>
    `my daughter is ${pickAge(rnd)} years old and ${pick(rnd, ["loves art", "wants to learn Python", "is shy", "hyper active"])}`,
  (rnd) =>
    `my ${pickAge(rnd)} year old daughter ${pick(rnd, ["loves reading", "gifted at math", "needs confidence"])}`,
  (rnd) =>
    `she is ${pickAge(rnd)} years old and ${pick(rnd, ["she loves Roblox", "she wants robotics", "her hobby is piano"])}`,
  (rnd) =>
    `she's ${pickAge(rnd)} and ${pick(rnd, ["into game design", "loves science", "very social"])}`,
  (rnd) =>
    `benti ${pickAge(rnd)} years ${pick(rnd, ["creative", "quiet", "ambitious"])} w ${pick(rnd, ["games", "Arabic", "drawing"])}`,
  (rnd) =>
    `I have a girl ${pickAge(rnd)} years old, ${pick(rnd, ["ADHD", "curious", "competitive"])} ${pick(rnd, ["enjoys crafts", "loves Scratch"])}`,
  (rnd) =>
    `my sister's kid is a girl, ${pickAge(rnd)} years old, ${pick(rnd, ["loves books", "into STEM"])}`,
  (rnd) =>
    `high school girl ${pickAge(rnd)} wants ${pick(rnd, ["competitive programming", "web design", "AI"])}`,
];

const AR_GENDER_BOY_TEMPLATES = [
  (rnd) =>
    `ابني عمره ${pickAge(rnd)} سنين و${pick(rnd, ["يحب البرمجة", "خجول", "نشيط", "يحب الروبوت", "يحب الالعاب"])}`,
  (rnd) =>
    `ولدي ${pickAge(rnd)} سنه ${pick(rnd, ["موهوب", "هادئ", "فرط حركه"])} و${pick(rnd, ["يحب التركيب", "يبي يتعلم بايثون", "يحفظ قران"])}`,
  (rnd) =>
    `عندي ولد عمره ${pickAge(rnd)} ${pick(rnd, ["يحب الماينكرافت", "ذكي", "يحتاج تشجيع"])}`,
  (rnd) =>
    `ابني ${pickAge(rnd)} سنه ${pick(rnd, ["توحد", "فضولي", "انطوائي"])} و${pick(rnd, ["يحب الارقام", "يحب الالوان"])}`,
  (rnd) =>
    `طفل عمره ${pickAge(rnd)} سنوات ${pick(rnd, ["يحب الفيزياء", "يحب حل المسائل"])} ابني يحب التكنولوجيا`,
  (rnd) =>
    `ابني عنده ${pickAge(rnd)} سنين ${pick(rnd, ["كثير الحركة", "صبور", "طموح"])}`,
  (rnd) =>
    `ولدي عمر ${pickAge(rnd)} ${pick(rnd, ["يحب روبلوكس", "يبي مسابقات برمجة", "يحب البناء"])}`,
  (rnd) =>
    `ابن عمره ${toEasternNum(pickAge(rnd))} سنه ${pick(rnd, ["يحب القراءه", "يحب الروبوت"])}`,
];

const AR_GENDER_GIRL_TEMPLATES = [
  (rnd) =>
    `بنتي عمرها ${pickAge(rnd)} سنين و${pick(rnd, ["تحب الرسم", "تحب البرمجة", "خجوله", "نشيطه", "تحب الروبوت"])}`,
  (rnd) =>
    `ابنتي ${pickAge(rnd)} سنه ${pick(rnd, ["ذكيه", "هاديه", "اجتماعيه"])} و${pick(rnd, ["تحب القران", "تبي بايثون", "تحب التصميم"])}`,
  (rnd) =>
    `عندي بنت عمرها ${pickAge(rnd)} ${pick(rnd, ["تحب الالعاب", "موهوبه", "تحتاج تشجيع"])}`,
  (rnd) =>
    `بنت عمرها ${pickAge(rnd)} سنه ${pick(rnd, ["توحد", "فضوليه", "انطوائيه"])} و${pick(rnd, ["تحب الالوان", "تحب القراءه"])}`,
  (rnd) =>
    `ابنتي في المدرسه عمرها ${pickAge(rnd)} ${pick(rnd, ["تحب الرياضيات", "تحب الفن", "طموحه"])}`,
  (rnd) =>
    `بنتي عندها ${pickAge(rnd)} سنين ${pick(rnd, ["هاديه", "نشيطه جدا", "تحب التحدي"])}`,
  (rnd) =>
    `بنتي عمر ${pickAge(rnd)} ${pick(rnd, ["تحب ماينكرافت", "تبي مسابقات", "تحب العربي"])}`,
  (rnd) =>
    `بنت عمرها ${toEasternNum(pickAge(rnd))} سنه ${pick(rnd, ["تحب القصص", "تحب السكراتش"])}`,
];

const REQUIRED_KEYS = [
  "age",
  "gender",
  "adjectives",
  "interests",
  "experience_level",
  "parent_goals",
  "language",
  "special_needs",
  "learning_style",
  "energy_level",
  "social_preference",
  "motivation_type",
  "developmental_context",
];

function assertShape(profile, label) {
  for (const k of REQUIRED_KEYS) {
    if (!(k in profile)) {
      throw new Error(`${label}: missing key ${k}`);
    }
  }
  if (!Array.isArray(profile.adjectives)) throw new Error(`${label}: adjectives not array`);
  if (!Array.isArray(profile.interests)) throw new Error(`${label}: interests not array`);
  if (!Array.isArray(profile.parent_goals)) throw new Error(`${label}: parent_goals not array`);
}

function extractExpectedAge(text) {
  const normalized = allDigitsWestern(text);
  const patterns = [
    /\b(1[0-8]|[5-9])\s*(?:years?\s*old|year\s*old|yrs?)/i,
    /\b(?:age|aged|is)\s*(1[0-8]|[5-9])\b/i,
    /\b(1[0-8]|[5-9])\s*year\s*old\b/i,
    /\bmy\s+(1[0-8]|[5-9])\s+year\s+old\b/i,
    /want my\s+(1[0-8]|[5-9])\s+year old\b/i,
    /\bteenager\s+(1[0-8]|[5-9])\b/i,
    /\b(?:he|she)\s+is\s+(1[0-8]|[5-9])\s+years?\s+old\b/i,
    /\b(?:he|she)'s\s+(1[0-8]|[5-9])\b/i,
    /\bhigh\s+school\s+(?:boy|girl)\s+(1[0-8]|[5-9])\b/i,
    /\bchild is\s+(1[0-8]|[5-9])\b/i,
    /عمر(?:ه|ها|ك)?\s*(1[0-8]|[5-9])\s*(?:سن|سنة|سنوات|سنين)/,
    /عمر(?:ه|ها)?\s*(1[0-8]|[5-9])(?=\s+و|\s+ما|\s+ي|\s+ت|\s+ذ|\s+،|\s*$)/,
    /(?:ابني|بنتي|ولدي|طفلي|بنت|ابنتي)\s+عمر(?:ه|ها)?\s*(1[0-8]|[5-9])/,
    /\bابن\s+عمره\s*(1[0-8]|[5-9])\b/,
    /عندي\s+ولد\s+عمره\s*(1[0-8]|[5-9])/,
    /(?:ولد|بنت)\s+عمر(?:ه|ها)\s*(1[0-8]|[5-9])/,
    /ولدي\s+(1[0-8]|[5-9])\s+سنوات/,
    /طفلي\s+عمره\s+(1[0-8]|[5-9])\s/,
    /طالب\s+(1[0-8]|[5-9])\s*سنه/,
    /عمر\s+(1[0-8]|[5-9])\s/,
    /ابني\s+(1[0-8]|[5-9])\s+(?:سنه|سنين)/,
    /ابني\s+عنده\s+(1[0-8]|[5-9])\s+سنين/,
    /ابنتي\s+في\s+[^\d]+عمرها\s+(1[0-8]|[5-9])\s/,
    /ابنتي\s+(1[0-8]|[5-9])\s+سنه/,
    /بنتي\s+عندها\s+(1[0-8]|[5-9])\s+سنين/,
    /بنتي\s+عمر\s+(1[0-8]|[5-9])(?:\s|$)/,
    /عندي بنت عمرها\s+(1[0-8]|[5-9])/,
    /بنت عمرها\s+(1[0-8]|[5-9])\s+سنه/,
    /benti\s+(1[0-8]|[5-9])\s+years/i,
    /waladi\s+(1[0-8]|[5-9])\s+years/i,
  ];
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m) {
      const age = parseInt(m[1], 10);
      if (age >= 3 && age <= 20) return age;
    }
  }
  if (/\bfirst grader\b/i.test(normalized)) return 6;
  if (/\bmiddle school\b/i.test(normalized)) return 13;
  if (/\bhigh school\b/i.test(normalized)) return 16;
  const loose = normalized.match(/\b(1[0-8]|[5-9])\b/);
  if (loose) {
    const age = parseInt(loose[1], 10);
    if (age >= 3 && age <= 20) return age;
  }
  return null;
}

async function runBatch(label, rnd, templates, locale, count) {
  let shapeOk = 0;
  let ageHits = 0;
  let ageExpected = 0;
  const t0 = Date.now();
  const useLlm = process.env.PARSER_USE_LLM === "1";

  for (let i = 0; i < count; i++) {
    const text = pick(rnd, templates)(rnd);
    const expectedAge = extractExpectedAge(text);
    const profile = await parseWithGate(text, locale, { useLlm });
    assertShape(profile, `${label} #${i}`);
    shapeOk++;

    if (expectedAge != null) {
      ageExpected++;
      if (profile.age === expectedAge) ageHits++;
    }
  }

  const ms = Date.now() - t0;
  return { shapeOk, ageHits, ageExpected, ms, count };
}

async function runGenderBatch(label, rnd, templates, locale, count, expectedGender) {
  let shapeOk = 0;
  let genderHits = 0;
  let ageHits = 0;
  let ageExpected = 0;
  const t0 = Date.now();
  const useLlm = process.env.PARSER_USE_LLM === "1";

  for (let i = 0; i < count; i++) {
    const text = pick(rnd, templates)(rnd);
    const expectedAge = extractExpectedAge(text);
    const profile = await parseWithGate(text, locale, { useLlm });
    assertShape(profile, `${label} #${i}`);
    shapeOk++;
    if (profile.gender === expectedGender) genderHits++;

    if (expectedAge != null) {
      ageExpected++;
      if (profile.age === expectedAge) ageHits++;
    }
  }

  const ms = Date.now() - t0;
  return { label, shapeOk, genderHits, ageHits, ageExpected, ms, count, expectedGender };
}

async function mainGender10k() {
  const N = 2500;
  const useLlm = process.env.PARSER_USE_LLM === "1";

  console.log("=".repeat(72));
  console.log(
    `  Gender benchmark — ${N * 4} samples (${N} EN boy · ${N} EN girl · ${N} AR boy · ${N} AR girl)`
  );
  console.log(`  Mode: ${useLlm ? "local + LLM merge (API keys required)" : "local NLP only"}`);
  console.log("=".repeat(72));

  const rndEnBoy = mulberry32(0x51ed1001);
  const rndEnGirl = mulberry32(0x51ed2002);
  const rndArBoy = mulberry32(0x51ed3003);
  const rndArGirl = mulberry32(0x51ed4004);

  const batches = [
    await runGenderBatch("en · boy", rndEnBoy, EN_GENDER_BOY_TEMPLATES, "en", N, "boy"),
    await runGenderBatch("en · girl", rndEnGirl, EN_GENDER_GIRL_TEMPLATES, "en", N, "girl"),
    await runGenderBatch("ar · boy", rndArBoy, AR_GENDER_BOY_TEMPLATES, "ar", N, "boy"),
    await runGenderBatch("ar · girl", rndArGirl, AR_GENDER_GIRL_TEMPLATES, "ar", N, "girl"),
  ];

  let totalGenderHits = 0;
  let totalAgeHits = 0;
  let totalAgeExpected = 0;
  let totalMs = 0;

  for (const b of batches) {
    totalGenderHits += b.genderHits;
    totalAgeHits += b.ageHits;
    totalAgeExpected += b.ageExpected;
    totalMs += b.ms;
    console.log(`\n  ${b.label} (${b.count}):`);
    console.log(`    Gender exact:    ${b.genderHits}/${b.count}`);
    console.log(`    Age exact:       ${b.ageHits}/${b.ageExpected} (templates with detectable age)`);
    console.log(`    Time:            ${b.ms}ms (${(b.count / (b.ms / 1000)).toFixed(0)} samples/sec)`);
  }

  const totalN = N * 4;
  console.log(`\n  Combined:`);
  console.log(`    Gender exact:    ${totalGenderHits}/${totalN}`);
  console.log(`    Age exact:       ${totalAgeHits}/${totalAgeExpected}`);
  console.log(`    Total time:      ${totalMs}ms (${(totalN / (totalMs / 1000)).toFixed(0)} samples/sec)`);
  console.log("=".repeat(72));

  if (totalGenderHits !== totalN) {
    console.error(`\nFAIL: expected gender on all ${totalN} samples, got ${totalGenderHits}`);
    process.exit(1);
  }
}

async function main() {
  if (process.argv.includes("--gender10k")) {
    return mainGender10k();
  }

  const N_EN = 2000;
  const N_AR = 2000;
  const useLlm = process.env.PARSER_USE_LLM === "1";

  console.log("=".repeat(72));
  console.log(`  Parser gate benchmark — ${N_EN} EN + ${N_AR} AR (${N_EN + N_AR} total)`);
  console.log(`  Mode: ${useLlm ? "local + LLM merge (API keys required)" : "local NLP only"}`);
  console.log("=".repeat(72));

  const en = await runBatch("en", rndEn, EN_TEMPLATES, "en", N_EN);
  const ar = await runBatch("ar", rndAr, AR_TEMPLATES, "ar", N_AR);

  const totalMs = en.ms + ar.ms;
  const totalN = en.count + ar.count;

  console.log(`\n  English (${N_EN}):`);
  console.log(`    Shape valid:     ${en.shapeOk}/${en.count}`);
  console.log(`    Age exact match: ${en.ageHits}/${en.ageExpected} (templates with detectable age)`);
  console.log(`    Time:            ${en.ms}ms (${(en.count / (en.ms / 1000)).toFixed(0)} samples/sec)`);

  console.log(`\n  Arabic (${N_AR}):`);
  console.log(`    Shape valid:     ${ar.shapeOk}/${ar.count}`);
  console.log(`    Age exact match: ${ar.ageHits}/${ar.ageExpected} (templates with detectable age)`);
  console.log(`    Time:            ${ar.ms}ms (${(ar.count / (ar.ms / 1000)).toFixed(0)} samples/sec)`);

  console.log(`\n  Combined:`);
  console.log(`    Shape valid:     ${en.shapeOk + ar.shapeOk}/${totalN}`);
  console.log(`    Age exact match: ${en.ageHits + ar.ageHits}/${en.ageExpected + ar.ageExpected}`);
  console.log(`    Total time:      ${totalMs}ms (${(totalN / (totalMs / 1000)).toFixed(0)} samples/sec)`);
  console.log("=".repeat(72));

  if (en.shapeOk !== en.count || ar.shapeOk !== ar.count) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
