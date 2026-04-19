const test = require("node:test");
const assert = require("node:assert/strict");
const { reconcileInterestsWithParentText } = require("../services/aiParserGate");
const rc = require("../controllers/recommendController");

test("robotics teen prompt: local profile favors STEM, not Arabic", () => {
  const msg = "My daughter is 14 and dreams of building her own robot";
  const p = rc._parseChildProfile(msg, "en");
  assert.equal(p.interests.includes("arabic"), false);
  assert.equal(p.interests.includes("robots"), true);
  assert.equal(p.interests.includes("building"), true);
  assert.equal(p.adjectives.includes("hands_on"), true);
  assert.equal(p.parent_goals.includes("build_robots"), true);
});

test("after LLM merge, strip arabic interest when parent text is robotics-only", () => {
  const msg = "My daughter is 14 and dreams of building her own robot";
  const merged = { interests: ["robots", "building", "arabic"], adjectives: [] };
  reconcileInterestsWithParentText(msg, merged);
  assert.deepEqual(merged.interests, ["robots", "building"]);
});

test("keep arabic when parent explicitly asks (English)", () => {
  const msg = "She is 14 and wants to learn Arabic and Quran";
  const merged = { interests: ["arabic"] };
  reconcileInterestsWithParentText(msg, merged);
  assert.equal(merged.interests.includes("arabic"), true);
});

test("keep arabic when both robotics and Arabic are requested", () => {
  const msg = "14 years old, loves building robots and wants Arabic reading";
  const merged = { interests: ["robots", "arabic"] };
  reconcileInterestsWithParentText(msg, merged);
  assert.equal(merged.interests.includes("arabic"), true);
  assert.equal(merged.interests.includes("robots"), true);
});
