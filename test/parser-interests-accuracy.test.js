/**
 * Broad regression tests: local NLP parser interests + scoreCourses top ranks
 * stay aligned with parent intent (STEM vs Arabic vs games, etc.).
 *
 * Uses the same catalog slugs/ages as data/defaultCourses.js (no MongoDB).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const rc = require("../controllers/recommendController");
const defaultCourses = require("../data/defaultCourses");

const MOCK_CATALOG = defaultCourses.map((c) => ({
  slug: c.slug,
  category: c.category,
  ageMin: c.ageMin,
  ageMax: c.ageMax,
  level: c.level,
}));

function parseAndRank(message, locale = "en") {
  const profile = rc._parseChildProfile(message, locale);
  const ranked = rc
    ._scoreCourses(profile, MOCK_CATALOG)
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.slug);
  return { profile, ranked };
}

function assertInterestsContain(interests, required, message) {
  for (const x of required) {
    assert.ok(
      interests.includes(x),
      `Expected interest "${x}" in [${interests.join(", ")}] for: ${JSON.stringify(message)}`
    );
  }
}

function assertInterestsLack(interests, forbidden, message) {
  for (const x of forbidden) {
    assert.ok(
      !interests.includes(x),
      `Should not infer interest "${x}" in [${interests.join(", ")}] for: ${JSON.stringify(message)}`
    );
  }
}

/** At least one slug from `candidates` appears in the top N ranked courses. */
function assertTopIncludes(ranked, candidates, n, message) {
  const slice = ranked.slice(0, n);
  const hit = candidates.some((s) => slice.includes(s));
  assert.ok(
    hit,
    `Expected one of [${candidates.join(", ")}] in top-${n} [${slice.join(", ")}] for: ${JSON.stringify(message)}`
  );
}

/** Every slug in `expected` appears in top N (for multi-track intents). */
function assertTopContainsAll(ranked, expected, n, message) {
  const slice = new Set(ranked.slice(0, n));
  for (const slug of expected) {
    assert.ok(slice.has(slug), `Expected top-${n} to include "${slug}" for: ${JSON.stringify(message)}`);
  }
}

const CASES = [
  // ── Robotics / building ─────────────────────────────────────────
  {
    msg: "My daughter is 14 and dreams of building her own robot",
    mustHave: ["robots", "building"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-advanced", "robot-basics"],
  },
  {
    msg: "Son is 10, obsessed with robotics and lego",
    mustHave: ["robots", "building"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-basics"],
  },
  {
    msg: "ابني عمره 11 ويحب الروبوتات والبرمجة",
    locale: "ar",
    mustHave: ["robots"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-basics", "python", "scratch"],
  },
  {
    msg: "8 year old wants to build circuits and robots",
    mustHave: ["electronics", "robots", "building"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-basics"],
  },
  // ── Coding / programming / web / AI ─────────────────────────────
  {
    msg: "My 12 year old wants to learn Python coding",
    mustHave: ["coding"],
    mustNotHave: ["arabic"],
    topIncludes: ["python", "scratch"],
  },
  {
    msg: "She is 15 and wants to become a software developer",
    mustHave: ["programming"],
    mustNotHave: ["arabic"],
    topIncludes: ["python", "webdev", "algo-intro"],
  },
  {
    msg: "Teen 16 interested in HTML, CSS and making websites",
    mustHave: ["web"],
    mustNotHave: ["arabic"],
    topIncludes: ["webdev"],
  },
  {
    msg: "14 year old into graphic design and UI",
    mustHave: ["design"],
    mustNotHave: ["arabic"],
    topIncludes: ["webdev", "gamedev"],
  },
  {
    msg: "Kid 13 wants to draw, learn animation and game art",
    mustHave: ["animation", "drawing", "games"],
    mustNotHave: ["arabic"],
    topIncludes: ["scratch", "gamedev"],
  },
  {
    msg: "15 years old curious about machine learning and AI",
    mustHave: ["ai"],
    mustNotHave: ["arabic"],
    topIncludes: ["python", "robot-advanced"],
  },
  {
    msg: "The teacher said he is 11 and very good at math",
    mustHave: ["math"],
    mustNotHave: ["ai", "arabic"],
    topIncludes: ["algo-intro", "python"],
  },
  // ── Games ───────────────────────────────────────────────────────
  {
    msg: "My 12 year old plays Minecraft and Roblox all weekend",
    mustHave: ["games"],
    mustNotHave: ["arabic"],
    topIncludes: ["gamedev", "scratch"],
  },
  // ── Arabic / Quran ──────────────────────────────────────────────
  {
    msg: "Daughter 9, we want her to improve Arabic reading and writing",
    mustHave: ["arabic"],
    mustNotHave: [],
    topIncludes: ["arabic-reading", "arabic-recitation"],
  },
  {
    msg: "Boy 12 memorizing Quran and tajweed",
    mustHave: ["arabic"],
    mustNotHave: ["robots"],
    topIncludes: ["arabic-recitation", "arabic-memorization"],
  },
  {
    msg: "عندي بنت عمرها 10 وتتعلم قواعد النحو",
    locale: "ar",
    mustHave: ["arabic"],
    mustNotHave: [],
    topIncludes: ["arabic-grammar", "arabic-reading"],
  },
  // ── Science / math ──────────────────────────────────────────────
  {
    msg: "10 year old loves physics experiments and science fairs",
    mustHave: ["science"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-basics", "python"],
  },
  {
    msg: "She is 11 and excels at mathematics and puzzles",
    mustHave: ["math"],
    mustNotHave: ["arabic"],
    topIncludes: ["algo-intro", "algo-competitive"],
  },
  // ── Art / drawing ───────────────────────────────────────────────
  {
    msg: "Creative 9 year old loves drawing comics and painting",
    mustHave: ["drawing"],
    mustNotHave: ["arabic"],
    topIncludes: ["scratch", "gamedev"],
  },
  {
    msg: "8 year old artistic, loves art class",
    mustHave: ["art"],
    mustNotHave: ["arabic"],
    topIncludes: ["scratch", "gamedev"],
  },
  // ── Sports (maps to robot-basics in catalog) ───────────────────
  {
    msg: "Active 10 year old plays football and swimming",
    mustHave: ["sports"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-basics"],
  },
  // ── Computers / technology ────────────────────────────────────
  {
    msg: "13 year old always on the laptop learning technology",
    mustHave: ["computers", "technology"],
    mustNotHave: ["arabic"],
    topIncludes: ["python", "webdev"],
  },
  // ── STEM vs Arabic: explicit both ───────────────────────────────
  {
    msg: "14 year old wants robotics club and weekend Arabic grammar",
    mustHave: ["robots", "arabic"],
    mustNotHave: [],
    topIncludes: ["robot-advanced", "arabic-grammar"],
  },
  // ── Competitive algorithms teen ────────────────────────────────
  {
    msg: "16 year old competes in programming olympiads and loves mathematics",
    mustHave: ["programming", "math"],
    mustNotHave: ["arabic"],
    topIncludes: ["algo-competitive", "algo-intro"],
  },
  {
    msg: "11 year old wants to code games in Scratch",
    mustHave: ["coding", "games"],
    mustNotHave: ["arabic"],
    topIncludes: ["scratch", "gamedev"],
  },
  {
    msg: "طفلي عمره 9 ويحب الرسم والالعاب",
    locale: "ar",
    mustHave: ["drawing", "games"],
    mustNotHave: ["arabic"],
    topIncludes: ["scratch", "gamedev"],
  },
  {
    msg: "13 year old is passionate about electronics and Arduino",
    mustHave: ["electronics"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-basics", "robot-advanced"],
  },
  {
    msg: "12 year old swimmer and runner, very sporty",
    mustHave: ["sports"],
    mustNotHave: ["arabic"],
    topIncludes: ["robot-basics"],
  },
  {
    msg: "Age 14 wants artificial intelligence not languages",
    mustHave: ["ai"],
    mustNotHave: ["arabic"],
    topIncludes: ["python", "robot-advanced"],
  },
  {
    msg: "9 year old beginner loves science and math together",
    mustHave: ["science", "math"],
    mustNotHave: ["arabic"],
    topIncludes: ["algo-intro", "robot-basics", "python"],
  },
  {
    msg: "She is 10 and wants to learn programming and web design",
    mustHave: ["programming", "web", "design"],
    mustNotHave: ["arabic"],
    topIncludes: ["webdev", "scratch", "python"],
  },
];

for (const c of CASES) {
  test(`interests + top courses: ${c.msg.slice(0, 52)}${c.msg.length > 52 ? "…" : ""}`, () => {
    const locale = c.locale || "en";
    const { profile, ranked } = parseAndRank(c.msg, locale);
    assertInterestsContain(profile.interests, c.mustHave, c.msg);
    assertInterestsLack(profile.interests, c.mustNotHave, c.msg);
    assertTopIncludes(ranked, c.topIncludes, 6, c.msg);
  });
}

test("parser: goal build_robots is set for natural robot-building phrasing", () => {
  const msg = "My daughter is 14 and dreams of building her own robot";
  const p = rc._parseChildProfile(msg, "en");
  assert.ok(p.parent_goals.includes("build_robots"));
});

test("parser: hands-on STEM phrasing picks hands_on not generic ambitious", () => {
  const msg = "My daughter is 14 and dreams of building her own robot";
  const p = rc._parseChildProfile(msg, "en");
  assert.ok(p.adjectives.includes("hands_on"));
  assert.equal(p.adjectives.includes("ambitious"), false);
});

test("ranking: Arabic-only intent surfaces multiple arabic slugs in top tier", () => {
  const msg = "Child 10, focus on Arabic recitation and memorization this year";
  const { profile, ranked } = parseAndRank(msg, "en");
  assert.ok(profile.interests.includes("arabic"));
  assertTopContainsAll(ranked, ["arabic-recitation", "arabic-memorization"], 8, msg);
});

test("ranking: young game lover should not place arabic above scratch/gamedev", () => {
  const msg = "7 year old loves video games and wants to make games";
  const { profile, ranked } = parseAndRank(msg, "en");
  assertInterestsContain(profile.interests, ["games"], msg);
  const top3 = ranked.slice(0, 3);
  assert.ok(
    top3.some((s) => ["scratch", "gamedev"].includes(s)),
    `expected scratch/gamedev in top 3, got ${top3.join(", ")}`
  );
  assert.equal(top3.includes("arabic-reading"), false);
});
