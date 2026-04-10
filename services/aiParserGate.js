/**
 * AI Parser Gate (AegisGate-style): sanitize input → optional structured LLM JSON → * validate against allowlists → merge with deterministic local NLP parser.
 *
 * Local parser remains source of truth for resilience; LLM augments missing fields.
 */

const { validateAndNormalizeProfile, mergeProfiles } = require("../config/childProfileSchema");
const { enrichProfileWithEvidenceContext } = require("../config/evidenceBasedFramework");

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

If unsure, use null or []. Never invent ages outside 3-20.`;
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
  return enrichProfileWithEvidenceContext(mergeProfiles(local, llmNorm));
}

module.exports = {
  parseWithGate,
  sanitizeParentInput,
  validateAndNormalizeProfile,
  mergeProfiles,
};
