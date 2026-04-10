/**
 * Synthetic parent messages for recommend / parser benchmarks (EN + AR).
 */

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rnd, arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

function pickAge(rnd) {
  return 5 + Math.floor(rnd() * 12);
}

const INDIC = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";
function toEasternNum(n) {
  return String(n)
    .split("")
    .map((d) => INDIC[parseInt(d, 10)])
    .join("");
}

const EN_TEMPLATES = [
  (rnd) =>
    `my ${pick(rnd, ["son", "daughter"])} is ${pickAge(rnd)} years old and ${pick(rnd, ["very creative", "hyper active", "shy", "loves robots", "loves games", "into coding"])}`,
  (rnd) => `I want my ${pickAge(rnd)} year old to learn ${pick(rnd, ["Quran", "Arabic", "Python", "robotics", "web development"])}`,
  (rnd) =>
    `child is ${pickAge(rnd)}, ${pick(rnd, ["ADHD", "gifted", "curious", "competitive"])}, enjoys ${pick(rnd, ["Minecraft", "building", "math", "reading"])}`,
  (rnd) => `benti ${pickAge(rnd)} years ${pick(rnd, ["creative", "social", "introverted"])} w ${pick(rnd, ["games", "art", "science"])}`,
  (rnd) => `waladi ${pickAge(rnd)} years shy and smart`,
  (rnd) => `she's ${pickAge(rnd)} and ${pick(rnd, ["wants to build games", "loves drawing", "into competitive programming"])}`,
  (rnd) => `middle school student interested in ${pick(rnd, ["AI", "robots", "algorithms"])}`,
  (rnd) =>
    `my ${pickAge(rnd)} year old ${pick(rnd, ["son", "daughter"])} ${pick(rnd, ["loves science", "needs confidence", "is very analytical"])}`,
  (rnd) => `first grader who ${pick(rnd, ["loves games", "likes robots", "enjoys reading"])}`,
  (rnd) => `high school ${pick(rnd, ["boy", "girl"])} wants ${pick(rnd, ["web development", "competitive programming", "game dev"])}`,
  (rnd) =>
    `teenager ${pickAge(rnd)} ${pick(rnd, ["introverted", "social", "ambitious"])} ${pick(rnd, ["codes already", "never coded", "loves math"])}`,
];

const AR_TEMPLATES = [
  (rnd) =>
    `ابني عمره ${pickAge(rnd)} سنين و${pick(rnd, ["يحب البرمجة", "يحب الروبوت", "خجول", "نشيط جدا", "يحب الالعاب"])}`,
  (rnd) =>
    `بنتي عمرها ${pickAge(rnd)} سنة ${pick(rnd, ["ذكية", "هادية", "اجتماعية", "طموحة"])} و${pick(rnd, ["تحب الرسم", "تحب القران", "تحب الرياضيات"])}`,
  (rnd) =>
    `ولدي ${pickAge(rnd)} سنوات ${pick(rnd, ["فرط حركة", "مبدع", "خجول"])} و${pick(rnd, ["يبي يتعلم برمجة", "يحب التركيب", "يحفظ قران"])}`,
  (rnd) =>
    `طفلي عمره ${pickAge(rnd)} ${pick(rnd, ["مايركز", "سريع التعلم", "يحب التجارب"])} و${pick(rnd, ["يحب العلوم", "يحب الكمبيوتر"])}`,
  (rnd) =>
    `ابنتي في ${pick(rnd, ["الصف الثالث", "اول متوسط", "ثانوي"])} عمرها ${pickAge(rnd)} و${pick(rnd, ["تحب التصميم", "تحب العربي", "تبي مسابقات"])}`,
  (rnd) =>
    `عندي ولد عمره ${pickAge(rnd)} ${pick(rnd, ["موهوب", "انطوائي", "فضولي"])} يحب ${pick(rnd, ["الروبوت", "الالعاب", "القراءة"])}`,
  (rnd) =>
    `بنت عمرها ${toEasternNum(pickAge(rnd))} ${pick(rnd, ["سنه", "سنوات"])} ${pick(rnd, ["تحب تلاوة القران", "تحب البرمجة", "خجوله جدا"])}`,
  (rnd) =>
    `ابني ${pickAge(rnd)} ${pick(rnd, ["سنه", "سنين"])} توحد و${pick(rnd, ["يحب الروتين", "يحب الالوان", "يحب الارقام"])}`,
  (rnd) =>
    `ولدي عمر ${pickAge(rnd)} ${pick(rnd, ["يحب ماينكرافت", "يحب روبلوكس", "يبي يصنع العاب"])}`,
  (rnd) =>
    `ابنتي عمرها ${pickAge(rnd)} ${pick(rnd, ["تقرا عربي", "تبي تحفظ قران", "تحب الفن"])}`,
  (rnd) =>
    `طالب ${pickAge(rnd)} سنه ${pick(rnd, ["يحب الفيزياء", "يحب حل المسائل", "يحب البناء"])}`,
  (rnd) =>
    `ابني عنده ${pickAge(rnd)} سنين ${pick(rnd, ["كثير الحركة", "ما يهدا", "يحب النشاط"])}`,
];

/**
 * @param {number} countEn
 * @param {number} countAr
 * @param {{ enSeed?: number, arSeed?: number }} [opts]
 * @returns {{ locale: string, message: string }[]}
 */
function buildRecommendJobs(countEn, countAr, opts = {}) {
  const enSeed = opts.enSeed ?? 0x9e3779b9;
  const arSeed = opts.arSeed ?? 0xbeefcafe;
  const rndEn = mulberry32(enSeed);
  const rndAr = mulberry32(arSeed);
  const jobs = [];
  for (let i = 0; i < countEn; i++) {
    const gen = pick(rndEn, EN_TEMPLATES);
    jobs.push({ locale: "en", message: gen(rndEn) });
  }
  for (let i = 0; i < countAr; i++) {
    const gen = pick(rndAr, AR_TEMPLATES);
    jobs.push({ locale: "ar", message: gen(rndAr) });
  }
  return jobs;
}

module.exports = {
  mulberry32,
  pick,
  pickAge,
  toEasternNum,
  EN_TEMPLATES,
  AR_TEMPLATES,
  buildRecommendJobs,
};
