/**
 * AI Parser Gate (AegisGate-style): sanitize input → optional structured LLM JSON → * validate against allowlists → merge with deterministic local NLP parser.
 *
 * Local parser remains source of truth for resilience; LLM augments missing fields.
 */

const { validateAndNormalizeProfile, mergeProfiles } = require("../config/childProfileSchema");
const { enrichProfileWithEvidenceContext } = require("../config/evidenceBasedFramework");

/** Strip LLM-hallucinated `arabic` when the parent text clearly describes STEM/robotics but never mentions Arabic/Quranic study. */
const EXPLICIT_ARABIC_CONTEXT_RE =
  /arabic|qur['']?an|quran|كتاب\s*الله|عربي|العربيه|تلاو|تجويد|حفظ|نحو|قواعد|مسجد|إسلام|islam|tajweed/i;
const STEM_ROBOT_CONTEXT_RE =
  /\brobot(s|ics)?\b|روبوت|\b(build|building|make|making|design|designing)\b[\s\S]{0,48}\brobot(s|ics)?\b|\brobot(s|ics)?\b[\s\S]{0,48}\b(build|building|make|making)\b/i;

/** Parent text suggests physical building / tinkering (even without the word "robot"). */
const TACTILE_BUILDING_CONTEXT_RE =
  /\b(building\s+things?|loves?\s+to\s+build|loves?\s+building|builder|lego|hands-on|hands\s+on|tactile|make\s+things|physical\s+projects?|diy\b|electronics\s+kit|يركب|ليقو|اشغال\s+يدويه)\b/i;

/** LLM often adds these when the child is really a hands-on / robot kid; drop them unless the local parser also saw them. */
const LLM_SCREEN_STACK_INTERESTS = new Set(["coding", "programming", "web", "ai", "computers", "technology"]);

function localSignalsTactileOrRobotics(local) {
  const adj = local.adjectives || [];
  if (adj.includes("hands_on") || adj.includes("mechanical")) return true;
  const intr = local.interests || [];
  if (intr.some((i) => ["robots", "building", "electronics"].includes(i))) return true;
  const goals = local.parent_goals || [];
  if (goals.includes("build_robots")) return true;
  return false;
}

function shouldDropLlmOnlyScreenInterests(sanitized, local) {
  if (localSignalsTactileOrRobotics(local)) return true;
  if (STEM_ROBOT_CONTEXT_RE.test(sanitized)) return true;
  if (TACTILE_BUILDING_CONTEXT_RE.test(sanitized)) return true;
  return false;
}

function reconcileLlmScreenInterestsForTactileChild(sanitized, local, mergedProfile) {
  if (!mergedProfile || !Array.isArray(mergedProfile.interests)) return;
  if (!shouldDropLlmOnlyScreenInterests(sanitized, local)) return;
  const keep = new Set(local.interests || []);
  mergedProfile.interests = mergedProfile.interests.filter(
    (i) => !LLM_SCREEN_STACK_INTERESTS.has(i) || keep.has(i)
  );
}

function reconcileInterestsWithParentText(sanitized, mergedProfile) {
  if (!mergedProfile || !Array.isArray(mergedProfile.interests)) return;
  const hasArabicScript = /[\u0600-\u06FF]/.test(sanitized);
  const explicitArabic = hasArabicScript || EXPLICIT_ARABIC_CONTEXT_RE.test(sanitized);
  const robotStem = STEM_ROBOT_CONTEXT_RE.test(sanitized);
  if (robotStem && !explicitArabic) {
    mergedProfile.interests = mergedProfile.interests.filter((i) => i !== "arabic");
  }
}

function reconcileMergedProfileWithParentText(sanitized, local, mergedProfile) {
  reconcileInterestsWithParentText(sanitized, mergedProfile);
  reconcileLlmScreenInterestsForTactileChild(sanitized, local, mergedProfile);
}

function sanitizeParentInput(text) {
  if (typeof text !== "string") return "";
  let t = text.slice(0, 2000);
  t = t.replace(/[\u0000-\u001F\u007F]/g, " ");
  t = t
    .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions?/gi, "[redacted]")
    .replace(/ignore\s+the\s+above/gi, "[redacted]")
    .replace(/system\s*:\s*/gi, "[redacted]: ");
  return t.trim();
}

function lazyController() {
  return require("../controllers/recommendController");
}

function getAllowSets() {
  const c = lazyController();
  const adj = new Set(c._allowedAdjectiveList || []);
  const intr = new Set(c._allowedInterestList || []);
  return { adjectives: adj, interests: intr };
}

function buildSystemPrompt(locale, { adjectiveList, interestList }) {
  const lang = locale === "ar" ? "Arabic" : "English";
  return `You extract a structured child profile from a parent's message about their child.
Respond with ONE JSON object only (no markdown). Language of message may be ${lang} or mixed.

Required JSON shape:
{
  "age": number or null (3-20),
  "gender": "boy" | "girl" | null — when known use ONLY the strings "boy" or "girl" (never male/female/m/f),
  "adjectives": string[] — each MUST be one of the allowed traits (snake_case),
  "interests": string[] — each MUST be one of the allowed interests,
  "experience_level": "none" | "beginner" | "intermediate" | "advanced" | null,
  "parent_goals": string[] (short snake_case goals if clear, else []),
  "language": "en" | "ar" (primary language of the parent message),
  "special_needs": string or null (short label like ADHD, autism/ASD, dyslexia, or null),
  "learning_style": "visual" | "auditory" | "kinesthetic" | "reading_writing" | null,
  "energy_level": "low" | "medium" | "high" | null,
  "social_preference": "individual" | "large_group" | null,
  "motivation_type": "intrinsic" | "extrinsic" | "social" | null
}

Allowed adjectives (use only these; omit unknowns):
${adjectiveList.slice(0, 200).join(", ")}

Allowed interests (use only these):
${interestList.join(", ")}

If unsure, use null or []. Never invent ages outside 3-20.

Important: If the parent emphasizes building, robots, LEGO, engineering, circuits, or hands-on projects, do NOT add coding, programming, web, computers, technology, or ai to interests unless they explicitly ask for software, apps, games, or websites. Physical builders map to robots/building/electronics only.

If the parent describes science fairs, investigations, hypotheses, lab work, or research projects, include interest "research" (and science_oriented or curious in adjectives when it fits). For parent_goals you may use short snake_case strings that match the parent's intent (e.g. inquiry_research for inquiry / science-fair style goals).`;
}

async function parseStructuredOpenAI(sanitized, locale, systemPrompt) {
  if (!process.env.OPENAI_API_KEY) return null;
  const OpenAI = require("openai").default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const r = await client.chat.completions.create({
    model: process.env.OPENAI_PARSER_MODEL || "gpt-4o-mini",
    max_tokens: 600,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: sanitized },
    ],
  });
  const raw = r.choices[0]?.message?.content;
  if (!raw) return null;
  return JSON.parse(raw);
}

async function parseStructuredAnthropic(sanitized, locale, systemPrompt) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const r = await client.messages.create({
    model: process.env.ANTHROPIC_PARSER_MODEL || "claude-3-5-haiku-20241022",
    max_tokens: 600,
    system: `${systemPrompt}\nOutput ONLY raw JSON, no other text.`,
    messages: [{ role: "user", content: sanitized }],
  });
  const block = r.content?.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  let text = block.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  return JSON.parse(text);
}

async function parseStructuredLLM(sanitized, locale) {
  const { adjectives, interests } = getAllowSets();
  const adjectiveList = [...adjectives];
  const interestList = [...interests];
  const systemPrompt = buildSystemPrompt(locale, { adjectiveList, interestList });

  const order = (process.env.PARSER_LLM_ORDER || "openai,anthropic")
    .split(",")
    .map((s) => s.trim().toLowerCase());

  for (const provider of order) {
    try {
      let raw = null;
      if (provider === "openai") raw = await parseStructuredOpenAI(sanitized, locale, systemPrompt);
      else if (provider === "anthropic") raw = await parseStructuredAnthropic(sanitized, locale, systemPrompt);
      if (raw && typeof raw === "object") {
        const norm = validateAndNormalizeProfile(raw, { adjectives, interests });
        if (norm) return norm;
      }
    } catch (e) {
      console.error(`[aiParserGate] ${provider} parse failed:`, e.message);
    }
  }
  return null;
}

/**
 * @param {string} text
 * @param {string} locale
 * @param {{ useLlm?: boolean }} [options]
 */
async function parseWithGate(text, locale = "en", options = {}) {
  const useLlm = options.useLlm !== false && process.env.PARSER_USE_LLM !== "0";
  const parseLocal = lazyController()._parseChildProfile;
  const sanitized = sanitizeParentInput(text);
  const local = parseLocal(sanitized, locale);

  if (!useLlm || (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)) {
    return enrichProfileWithEvidenceContext(local);
  }

  const { adjectives, interests } = getAllowSets();
  let llmNorm = null;
  try {
    const rawLlm = await parseStructuredLLM(sanitized, locale);
    if (rawLlm) llmNorm = validateAndNormalizeProfile(rawLlm, { adjectives, interests });
  } catch (e) {
    console.error("[aiParserGate] LLM path failed:", e.message);
  }

  if (!llmNorm) return enrichProfileWithEvidenceContext(local);
  const merged = mergeProfiles(local, llmNorm);
  reconcileMergedProfileWithParentText(sanitized, local, merged);
  return enrichProfileWithEvidenceContext(merged);
}

module.exports = {
  parseWithGate,
  sanitizeParentInput,
  validateAndNormalizeProfile,
  mergeProfiles,
  reconcileInterestsWithParentText,
  reconcileMergedProfileWithParentText,
  reconcileLlmScreenInterestsForTactileChild,
};
