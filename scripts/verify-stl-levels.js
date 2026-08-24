/**
 * Verification for the five-level journey placement.
 * Read-only: checks DB state, API exposure, and age-band sanity.
 *
 *   node scripts/verify-stl-levels.js
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const Course = require("../models/Course");

const BANDS = {
  explorer: [5, 8],
  builder: [8, 10],
  creator: [9, 12],
  innovator: [11, 14],
  pro: [13, 18],
};
const LEVELS = Object.keys(BANDS);
const API = process.env.PUBLIC_API_URL || "https://procoderbe.onrender.com/api";

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const all = await Course.find({}, "slug stlLevel isActive ageMin ageMax category title").lean();
  const active = all.filter((c) => c.isActive);
  const arabic = all.filter((c) => c.category === "arabic");

  console.log("\n=== 1. Every ACTIVE course has a level ===");
  for (const c of active.sort((a, b) => a.slug.localeCompare(b.slug))) {
    check(
      LEVELS.includes(c.stlLevel),
      c.slug.padEnd(18),
      c.stlLevel ? `-> ${c.stlLevel}` : "NO LEVEL SET"
    );
  }

  console.log("\n=== 2. Discontinued Arabic courses stay off the journey ===");
  for (const c of arabic) {
    check(!c.stlLevel, c.slug.padEnd(18), c.stlLevel ? `wrongly placed in ${c.stlLevel}` : "unplaced (correct)");
  }

  console.log("\n=== 3. Age ranges overlap their level band ===");
  for (const c of active.filter((x) => LEVELS.includes(x.stlLevel))) {
    const [lo, hi] = BANDS[c.stlLevel];
    const overlap = Math.min(hi, c.ageMax) - Math.max(lo, c.ageMin) + 1;
    check(overlap > 0, `${c.slug.padEnd(18)} ages ${c.ageMin}-${c.ageMax} vs ${c.stlLevel} ${lo}-${hi}`, `overlap ${overlap}y`);
  }

  console.log("\n=== 4. Level distribution (active courses) ===");
  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  for (const c of active) if (counts[c.stlLevel] !== undefined) counts[c.stlLevel]++;
  for (const l of LEVELS) {
    const slugs = active.filter((c) => c.stlLevel === l).map((c) => c.slug);
    check(counts[l] > 0, `${l.padEnd(10)} ${counts[l]} course(s)`, slugs.join(", ") || "EMPTY LEVEL");
  }

  console.log("\n=== 5. Public API exposes stlLevel (no backend deploy needed for list) ===");
  try {
    const res = await fetch(`${API}/courses`, { signal: AbortSignal.timeout(60000) });
    const list = await res.json();
    const items = Array.isArray(list) ? list : list.items || [];
    const withLevel = items.filter((c) => c.stlLevel);
    check(items.length > 0, `GET /courses returned ${items.length} course(s)`);
    check(
      withLevel.length === items.length,
      `all ${items.length} API course(s) carry stlLevel`,
      `${withLevel.length}/${items.length}`
    );
    const sample = items.find((c) => c.stlLevel);
    if (sample) {
      const dres = await fetch(`${API}/courses/${sample.slug}`, { signal: AbortSignal.timeout(60000) });
      const detail = await dres.json();
      check(!!detail.stlLevel, `GET /courses/${sample.slug} carries stlLevel`, detail.stlLevel || "missing");
    }
  } catch (e) {
    check(false, "public API reachable", e.message);
  }

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
  await mongoose.disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
