/**
 * Load-test POST /api/recommend with the same JSON body as the Smart Recommendation UI
 * ({ message, locale }). Default: 300 English + 300 Arabic = 600 requests (>500 total).
 *
 * Requires stem-Be running with MongoDB + seeded courses (or Atlas with data).
 *
 *   node scripts/recommend-api-benchmark.js
 *   RECOMMEND_BASE=http://127.0.0.1:3000 node scripts/recommend-api-benchmark.js  # via Next proxy
 *   node scripts/recommend-api-benchmark.js --en 400 --ar 400 --concurrency 8
 *
 * Speed: set RECOMMEND_AI_ENHANCE=0 PARSER_USE_LLM=0 on the API server.
 *
 * Empty course collection: one probe POST runs first. If the API returns
 * "No courses available", the full benchmark is skipped (exit 0) so
 * `npm run test:all` still passes. Set REQUIRE_RECOMMEND_DB=1 to fail instead
 * (use in CI after seeding).
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { buildRecommendJobs } = require("./recommendPrompts");

function parseArgs() {
  const a = process.argv.slice(2);
  let en = 300;
  let ar = 300;
  let concurrency = 6;
  let base = (process.env.RECOMMEND_BASE || "http://127.0.0.1:5000").replace(/\/$/, "");

  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--en" && a[i + 1]) en = Math.max(0, parseInt(a[++i], 10));
    else if (a[i] === "--ar" && a[i + 1]) ar = Math.max(0, parseInt(a[++i], 10));
    else if (a[i] === "--concurrency" && a[i + 1]) concurrency = Math.max(1, parseInt(a[++i], 10));
    else if (a[i] === "--base" && a[i + 1]) base = String(a[++i]).replace(/\/$/, "");
  }

  return { en, ar, concurrency, base };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function mapPool(items, concurrency, fn) {
  let ix = 0;
  const workers = [];
  for (let w = 0; w < concurrency; w++) {
    workers.push(
      (async () => {
        while (true) {
          const j = ix++;
          if (j >= items.length) break;
          await fn(items[j], j);
        }
      })()
    );
  }
  await Promise.all(workers);
}

async function postRecommend(base, message, locale) {
  const url = `${base}/api/recommend`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, locale }),
  });
  const ms = Date.now() - t0;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* HTML or non-JSON */
  }
  return { status: res.status, ms, json, textPreview: text.slice(0, 120) };
}

/** @returns {"ok"|"no_courses"|"unknown"} */
async function probeRecommendAvailability(base) {
  const r = await postRecommend(base, "my child is 10 and likes coding", "en");
  if (r.status === 200 && r.json && Array.isArray(r.json.ids) && r.json.ids.length > 0) {
    return "ok";
  }
  const err = r.json && r.json.error != null ? String(r.json.error) : "";
  if (r.status === 500 && /no courses/i.test(err)) {
    return "no_courses";
  }
  return "unknown";
}

async function main() {
  const { en, ar, concurrency, base } = parseArgs();
  const jobs = buildRecommendJobs(en, ar);
  const total = jobs.length;

  if (total === 0) {
    console.error("Nothing to run: --en and --ar are both 0");
    process.exit(1);
  }

  console.log("=".repeat(72));
  console.log(`  Recommend API benchmark — ${en} EN + ${ar} AR = ${total} POSTs`);
  console.log(`  Target: ${base}/api/recommend`);
  console.log(`  Concurrency: ${concurrency}`);
  console.log("=".repeat(72));

  const probe = await probeRecommendAvailability(base);
  if (probe === "no_courses") {
    const strict = process.env.REQUIRE_RECOMMEND_DB === "1";
    console.log(
      `\n  SKIPPED: API reports no courses in DB (${base}/api/recommend).\n` +
        `  Seed data with: npm run seed (from stem-Be)\n` +
        (strict ? "\n  REQUIRE_RECOMMEND_DB=1 set — exiting with error.\n" : "")
    );
    console.log("=".repeat(72));
    process.exit(strict ? 1 : 0);
  }

  let ok = 0;
  let fail = 0;
  const latencies = [];
  const errors = [];

  const tAll = Date.now();
  await mapPool(jobs, concurrency, async (job, idx) => {
    const r = await postRecommend(base, job.message, job.locale);
    latencies.push(r.ms);
    if (r.status === 200 && r.json && Array.isArray(r.json.ids) && r.json.ids.length > 0) {
      ok++;
    } else {
      fail++;
      if (errors.length < 12) {
        errors.push({
          i: idx,
          locale: job.locale,
          status: r.status,
          ms: r.ms,
          snippet: job.message.slice(0, 60),
          preview: r.textPreview.replace(/\s+/g, " "),
        });
      }
    }
  });
  const wallMs = Date.now() - tAll;

  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((s, x) => s + x, 0);

  console.log(`\n  Results:`);
  console.log(`    OK:           ${ok}/${total}`);
  console.log(`    Fail:         ${fail}/${total}`);
  console.log(`    Wall time:    ${wallMs}ms (${((total / wallMs) * 1000).toFixed(1)} req/s)`);
  console.log(`    Latency ms:   min ${latencies[0]} · p50 ${percentile(latencies, 50)} · p95 ${percentile(latencies, 95)} · max ${latencies[latencies.length - 1]} · avg ${(sum / latencies.length).toFixed(0)}`);

  if (errors.length) {
    console.log(`\n  Sample failures (up to ${errors.length}):`);
    for (const e of errors) {
      console.log(`    #${e.i} [${e.locale}] HTTP ${e.status} ${e.ms}ms — ${e.snippet}…`);
      console.log(`       ${e.preview}`);
    }
  }

  console.log("=".repeat(72));

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
