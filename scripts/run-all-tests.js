/**
 * Full local test suite: parser → recommend bench → API smoke → (optional) stem-Fe build.
 *
 *   npm run test:all
 *   SKIP_FE_BUILD=1 npm run test:all
 *
 * Requires stem-Be running on API_BASE (default 5000) for smoke, OR run smoke last after starting server manually.
 * Parser & bench only need Mongo for recommend bench if you hit real API — bench talks to API_BASE.
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const stemBeRoot = path.join(__dirname, "..");
const stemFeRoot = path.join(stemBeRoot, "..", "stem-Fe");

function run(name, cmd, args, cwd = stemBeRoot) {
  console.log(`\n${"=".repeat(60)}\n  ${name}\n${"=".repeat(60)}\n`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  if (r.status !== 0) {
    console.error(`\nABORT: "${name}" exited with ${r.status}\n`);
    process.exit(r.status ?? 1);
  }
}

console.log("\n*** ProCoder / stem-Be comprehensive test runner ***\n");

run("1/4 Parser pipeline (45 cases)", "npm", ["run", "test:parser"]);

run(
  "2/4 Recommend API load (20 EN + 20 AR)",
  "node",
  ["scripts/recommend-api-benchmark.js", "--en", "20", "--ar", "20", "--concurrency", "4"]
);

run("3/4 HTTP API integration smoke", "node", ["scripts/integration-smoke.js"]);

if (process.env.SKIP_FE_BUILD === "1") {
  console.log("\n  SKIP 4/4 (SKIP_FE_BUILD=1)\n");
} else if (fs.existsSync(path.join(stemFeRoot, "package.json"))) {
  run("4/4 Next.js production build (stem-Fe)", "npm", ["run", "build"], stemFeRoot);
} else {
  console.log("\n  SKIP 4/4 (stem-Fe not found next to stem-Be)\n");
}

console.log("\n*** All test stages completed successfully. ***\n");
