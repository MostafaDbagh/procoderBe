/**
 * Evidence-informed child-development layer for course matching.
 *
 * Synthesises widely taught concepts from developmental psychology and educational
 * science (introductory university / teacher-education curricula), including:
 * - Cognitive stage shifts (concrete → abstract reasoning) as in Piaget-inspired timelines
 * - Industry vs. inferiority & identity exploration (Erikson-style school-age / teen themes)
 * - Zone of proximal development & scaffolding (Vygotsky-inspired instructional fit)
 * - Executive function demands (inhibition, WM, cognitive flexibility) in learning tasks
 * - Temperament dimensions (reactivity, self-regulation) as in Thomas & Chess–style models
 * - Self-determination theory (autonomy, competence, relatedness) for motivation fit
 * - Individual differences in sensory processing and regulation (clinical ed. literature)
 *
 * This module does NOT output diagnoses; it nudges recommendations toward modalities that
 * meta-analyses and handbooks commonly associate with better engagement for similar profiles.
 * Always pair with professional assessment for clinical needs.
 */

/** Age bands with typical cognitive/social emphases (simplified for routing). */
const DEVELOPMENTAL_BANDS = [
  {
    min: 3,
    max: 7,
    key: "early_childhood",
    label_en: "Early childhood (ages 3-7): concrete, story- and play-based learning",
    cognitive_focus: ["symbolic_play", "emerging_logical_concrete", "short_instructional_units"],
    social_emotional: ["trust_practice", "autonomy_support", "low_evaluative_pressure"],
    high_scaffolding_slugs: ["scratch", "arabic-reading", "quran-recitation", "robot-basics"],
    low_ef_penalty_slugs: ["algo-competitive", "webdev"],
  },
  {
    min: 8,
    max: 11,
    key: "middle_childhood",
    label_en: "Middle childhood (ages 8-11): concrete-operational reasoning, peer skills",
    cognitive_focus: ["systematic_problem_solving", "rule_games", "guided_discovery"],
    social_emotional: ["industry_mastery_experiences", "peer_collaboration"],
    high_scaffolding_slugs: ["scratch", "python", "robot-basics", "algo-intro", "gamedev", "arabic-reading", "arabic-grammar"],
    low_ef_penalty_slugs: ["algo-competitive"],
  },
  {
    min: 12,
    max: 14,
    key: "early_adolescence",
    label_en: "Early adolescence (ages 12-14): abstract reasoning emerging, identity exploration",
    cognitive_focus: ["hypothetical_thinking", "project_identity", "deeper_specialisation"],
    social_emotional: ["belonging", "autonomy_choice", "competence_feedback"],
    high_scaffolding_slugs: ["python", "gamedev", "robot-advanced", "algo-intro", "webdev"],
    low_ef_penalty_slugs: [],
  },
  {
    min: 15,
    max: 20,
    key: "adolescence",
    label_en: "Adolescence (ages 15-20): formal reasoning, career/academic pathways",
    cognitive_focus: ["abstract_systems", "competition_prep", "portfolio_projects"],
    social_emotional: ["identity_consolidation", "future_orientation"],
    high_scaffolding_slugs: ["webdev", "algo-competitive", "robot-advanced", "python", "arabic-grammar"],
    low_ef_penalty_slugs: [],
  },
];

const EF_CHALLENGE_TRAITS = new Set([
  "poor_focus",
  "hyperactive",
  "impulsive",
  "anxious",
  "sensitive",
  "transition_sensitive",
]);

const SENSORY_SEEKING = new Set(["sensory_seeking", "hyperactive", "sporty"]);
const SENSORY_AVOIDANT = new Set(["sensory_sensitive", "shy", "anxious"]);

const AUTONOMY_TRAITS = new Set(["stubborn", "creative", "oppositional", "leader"]);

/** Course slug → rough executive-function demand (higher = more sustained attention / planning). */
const COURSE_EF_DEMAND = {
  scratch: 2,
  python: 4,
  webdev: 5,
  gamedev: 4,
  "robot-basics": 3,
  "robot-advanced": 5,
  "algo-intro": 5,
  "algo-competitive": 8,
  "arabic-reading": 3,
  "arabic-grammar": 6,
  "quran-recitation": 4,
  "quran-memorization": 7,
};

function bandForAge(age) {
  if (age == null || age < 3 || age > 20) return null;
  return DEVELOPMENTAL_BANDS.find((b) => age >= b.min && age <= b.max) || null;
}

function computeDevelopmentalContext(age, adjectives, specialNeeds) {
  const band = bandForAge(age);
  const adjSet = new Set(adjectives || []);

  const executive_function_signals = [...EF_CHALLENGE_TRAITS].filter((t) => adjSet.has(t));
  const sensory_profile = [];
  if ([...SENSORY_SEEKING].some((t) => adjSet.has(t))) sensory_profile.push("sensory_seeking_bias");
  if ([...SENSORY_AVOIDANT].some((t) => adjSet.has(t))) sensory_profile.push("sensory_avoidant_bias");

  let temperament_summary = "flexible";
  if (adjSet.has("angry") || adjSet.has("oppositional") || adjSet.has("stubborn")) {
    temperament_summary = "high_reactivity_autonomy_needs";
  } else if (adjSet.has("shy") || adjSet.has("sensitive") || adjSet.has("anxious")) {
    temperament_summary = "low_approach_warmth_needs";
  } else if (adjSet.has("cheerful") || adjSet.has("social")) {
    temperament_summary = "high_approach_social";
  }

  const motivation_hints = [];
  if (adjSet.has("competitive") || adjSet.has("performance_oriented")) motivation_hints.push("performance_goals");
  if (adjSet.has("mastery_oriented") || adjSet.has("curious") || adjSet.has("deep_thinker")) {
    motivation_hints.push("mastery_intrinsic");
  }
  if (adjSet.has("social") || adjSet.has("team_player")) motivation_hints.push("relatedness");

  const evidence_tags = [];
  if (band) evidence_tags.push(`band:${band.key}`);
  if (executive_function_signals.length) evidence_tags.push("exec_function_load");
  if (specialNeeds) evidence_tags.push(`support:${String(specialNeeds).slice(0, 24)}`);
  if (adjSet.has("gifted") || adjSet.has("fast_learner")) evidence_tags.push("acceleration_candidate");
  if (adjSet.has("struggling") || adjSet.has("needs_confidence")) evidence_tags.push("mastery_support");

  return {
    age_band: band ? band.key : null,
    age_band_label_en: band ? band.label_en : null,
    cognitive_focus: band ? band.cognitive_focus : [],
    social_emotional_focus: band ? band.social_emotional : [],
    executive_function_signals,
    sensory_profile,
    temperament_summary,
    motivation_hints,
    evidence_tags,
  };
}

/**
 * Extra score delta from developmental fit (kept modest to avoid swamping trait matrix).
 */
function evidenceScoringDelta(profile, course) {
  let d = 0;
  const slug = course.slug;
  const adj = new Set(profile.adjectives || []);
  const age = profile.age;
  const band = bandForAge(age);

  if (band) {
    if (band.high_scaffolding_slugs.includes(slug)) d += 3;
    if (band.low_ef_penalty_slugs.includes(slug) && [...EF_CHALLENGE_TRAITS].some((t) => adj.has(t))) {
      d -= 4;
    }
  }

  const efDemand = COURSE_EF_DEMAND[slug] ?? 5;
  const efLoad = [...EF_CHALLENGE_TRAITS].filter((t) => adj.has(t)).length;
  if (efLoad >= 2 && efDemand >= 6) d -= 3;
  if (efLoad >= 1 && efDemand <= 3) d += 2;

  if ([...SENSORY_SEEKING].some((t) => adj.has(t)) && ["robot-basics", "robot-advanced", "scratch"].includes(slug)) {
    d += 2;
  }
  if ([...SENSORY_AVOIDANT].some((t) => adj.has(t)) && ["quran-recitation", "arabic-reading", "scratch"].includes(slug)) {
    d += 2;
  }

  if ([...AUTONOMY_TRAITS].some((t) => adj.has(t)) && ["gamedev", "webdev", "scratch"].includes(slug)) {
    d += 2;
  }

  if ((adj.has("abstract_thinker") || adj.has("gifted")) && ["algo-competitive", "algo-intro", "webdev"].includes(slug)) {
    d += 2;
  }
  if (adj.has("concrete_thinker") && ["scratch", "robot-basics", "arabic-reading"].includes(slug)) {
    d += 2;
  }

  if (age && age >= 14 && (adj.has("ambitious") || adj.has("tech_oriented")) && ["webdev", "algo-competitive", "python"].includes(slug)) {
    d += 2;
  }

  return d;
}

function enrichProfileWithEvidenceContext(profile) {
  if (!profile || typeof profile !== "object") return profile;
  return {
    ...profile,
    developmental_context: computeDevelopmentalContext(
      profile.age,
      profile.adjectives,
      profile.special_needs
    ),
  };
}

module.exports = {
  DEVELOPMENTAL_BANDS,
  computeDevelopmentalContext,
  evidenceScoringDelta,
  bandForAge,
  enrichProfileWithEvidenceContext,
};
