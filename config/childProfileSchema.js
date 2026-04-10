/**
 * Child profile shape (local NLP + gated LLM) — validate / coerce outputs.
 * Pattern: structured JSON + allowlist filtering (LLM gateway style).
 */

const EXPERIENCE_LEVELS = new Set(["none", "beginner", "intermediate", "advanced"]);
const GENDERS = new Set(["boy", "girl"]);
const LANGS = new Set(["en", "ar"]);

/** Normalize to exactly `boy` | `girl` | null (no other strings). */
function coerceGender(v) {
  if (v == null || v === "") return null;
  const s = String(v).toLowerCase().trim().replace(/\s+/g, "_");
  if (GENDERS.has(s)) return s;
  const boy = new Set([
    "male", "m", "son", "brother", "man", "guy", "he", "his",
    "ذكر", "ولد", "صبي", "ابن",
  ]);
  const girl = new Set([
    "female", "f", "daughter", "sister", "woman", "gal", "she", "her",
    "انثى", "انثي", "بنت", "ابنه",
  ]);
  if (boy.has(s)) return "boy";
  if (girl.has(s)) return "girl";
  return null;
}
const ENERGY = new Set(["low", "medium", "high"]);
const LEARNING_STYLES = new Set(["visual", "auditory", "kinesthetic", "reading_writing"]);
const SOCIAL = new Set(["individual", "large_group"]);
const MOTIVATION = new Set(["intrinsic", "extrinsic", "social"]);

function coerceAge(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (Number.isNaN(n) || n < 3 || n > 20) return null;
  return n;
}

function coerceStringArray(v, allowedSet) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const x of v) {
    const s = String(x).toLowerCase().trim().replace(/\s+/g, "_");
    if (allowedSet && allowedSet.size && !allowedSet.has(s)) continue;
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

/**
 * @param {object} raw - parsed JSON from LLM or partial object
 * @param {{ adjectives: Set<string>, interests: Set<string> }} allow */
function validateAndNormalizeProfile(raw, allow) {
  if (!raw || typeof raw !== "object") return null;

  const profile = {
    age: coerceAge(raw.age),
    gender: coerceGender(raw.gender),
    adjectives: coerceStringArray(raw.adjectives, allow.adjectives),
    interests: coerceStringArray(raw.interests, allow.interests),
    experience_level: EXPERIENCE_LEVELS.has(raw.experience_level) ? raw.experience_level : null,
    parent_goals: Array.isArray(raw.parent_goals)
      ? [...new Set(raw.parent_goals.map((g) => String(g).toLowerCase().trim()).filter(Boolean))]
      : [],
    language: LANGS.has(raw.language) ? raw.language : null,
    special_needs: raw.special_needs == null || raw.special_needs === "" ? null : String(raw.special_needs),
    learning_style: LEARNING_STYLES.has(raw.learning_style) ? raw.learning_style : null,
    energy_level: ENERGY.has(raw.energy_level) ? raw.energy_level : null,
    social_preference: SOCIAL.has(raw.social_preference) ? raw.social_preference : null,
    motivation_type: MOTIVATION.has(raw.motivation_type) ? raw.motivation_type : null,
  };

  return profile;
}

function mergeProfiles(local, llmNorm) {
  if (!llmNorm) return { ...local };

  const merged = { ...local };

  if (llmNorm.age != null) merged.age = llmNorm.age;

  const gLlm = coerceGender(llmNorm.gender);
  if (gLlm) merged.gender = gLlm;
  else merged.gender = coerceGender(local.gender);

  merged.adjectives = [...new Set([...(local.adjectives || []), ...(llmNorm.adjectives || [])])];
  merged.interests = [...new Set([...(local.interests || []), ...(llmNorm.interests || [])])];

  if (llmNorm.experience_level) merged.experience_level = llmNorm.experience_level;
  else if (!merged.experience_level) merged.experience_level = local.experience_level;

  merged.parent_goals = [...new Set([...(local.parent_goals || []), ...(llmNorm.parent_goals || [])])];

  if (llmNorm.language) merged.language = llmNorm.language;
  if (llmNorm.special_needs && !merged.special_needs) merged.special_needs = llmNorm.special_needs;
  if (llmNorm.learning_style) merged.learning_style = llmNorm.learning_style;
  if (llmNorm.energy_level) merged.energy_level = llmNorm.energy_level;
  if (llmNorm.social_preference) merged.social_preference = llmNorm.social_preference;
  if (llmNorm.motivation_type) merged.motivation_type = llmNorm.motivation_type;

  return merged;
}

module.exports = {
  validateAndNormalizeProfile,
  mergeProfiles,
  coerceAge,
  coerceGender,
  EXPERIENCE_LEVELS,
  GENDERS,
  LANGS,
};
