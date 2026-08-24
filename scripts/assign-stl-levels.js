/**
 * Place courses on the five-level STL learning journey.
 *
 * Mapping decided by a multi-lens review of the STL Learning Journey &
 * Curriculum Framework against each course's real age range and difficulty.
 * Where the framework's named experience and the age band disagreed, the
 * tie-breaker was: never advertise a course on a level page whose published
 * age band it barely overlaps.
 *
 * Re-running is safe — it only writes when a value differs.
 *
 * Dry run (default, writes nothing):
 *   node scripts/assign-stl-levels.js
 * Apply:
 *   node scripts/assign-stl-levels.js --apply
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const Course = require("../models/Course");

/** slug -> journey level. */
const PLACEMENT = {
  // Explorer (5-8) — foundational thinking before formal programming
  "algo-intro": "explorer", // framework's named "Algorithm Adventures"

  // Builder (8-10) — programming becomes an explicit tool
  programming1: "builder", // "Programming Foundations"
  robotics: "builder", // named "Robotics Engineering Level 1"
  "web-beginner": "builder", // named "My First Website"

  // Creator (9-12) — combining concepts into complete projects
  python: "creator", // named "Python for Kids"
  mobappdev: "creator", // named "Create Your First Mobile App"
  programming2: "creator", // beginner sequel to programming1
  aifoundation: "creator", // 9-14 overlaps Creator 4/6y vs Builder 2/6y

  // Innovator (11-14) — applying and combining technologies
  "web-intermediate": "innovator", // 11-14 is an exact band match
  aiadvanced: "innovator", // intermediate at 10-15; Pro would invert the age band
  gamedev: "innovator", // inactive; framework's game ladder tops out here

  // Pro (13-18) — specialization, certification, portfolio
  pcep: "pro", // named "PCEP Preparation"
  "web-advanced": "pro", // 14-18 advanced specialization
};

/**
 * Courses that must NOT appear on the journey. Cleared explicitly rather than
 * omitted, because omission cannot remove a stale value.
 */
const CLEAR_CATEGORIES = ["arabic"]; // Arabic-language teaching is discontinued

/**
 * Left deliberately unplaced: the review split evenly between Explorer (ages
 * 6-9 fit) and Builder (the framework names Scratch as a Builder experience),
 * and it is inactive so nothing renders either way. Decide at reactivation.
 */
const UNRESOLVED = ["scratch"];

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  console.log(
    apply ? "APPLYING changes\n" : "DRY RUN — no writes (pass --apply to commit)\n"
  );

  const courses = await Course.find(
    {},
    "slug stlLevel isActive category"
  ).lean();

  let placed = 0;
  let cleared = 0;

  console.log("Placements:");
  for (const c of courses.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const mustClear = CLEAR_CATEGORIES.includes(c.category);
    const target = mustClear ? "" : PLACEMENT[c.slug];

    if (target === undefined) {
      const why = UNRESOLVED.includes(c.slug)
        ? "unresolved — decide at reactivation"
        : "not in mapping";
      console.log(`  ${c.slug.padEnd(20)} skip (${why})`);
      continue;
    }
    if ((c.stlLevel || "") === target) continue;

    const label = target === "" ? "CLEAR" : target;
    console.log(
      `  ${c.slug.padEnd(20)} ${(c.stlLevel || "—").padEnd(10)} ->  ${label}` +
        (c.isActive ? "" : "   (inactive)")
    );
    if (target === "") cleared++;
    else placed++;

    if (apply) {
      await Course.updateOne({ _id: c._id }, { $set: { stlLevel: target } });
    }
  }

  console.log(
    `\n${placed} placed, ${cleared} cleared ${apply ? "" : "(would be)"}.`
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
