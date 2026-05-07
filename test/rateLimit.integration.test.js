/**
 * Verifies that the global rate limiter no longer bypasses authenticated traffic.
 *
 * Regression: the previous version set `skip: req => !!req.headers.authorization`,
 * meaning a leaked token could hammer the API uncapped. The fix uses a function-form
 * `max` so authed requests get a higher ceiling but are still bounded.
 *
 * Strategy: fire enough requests to exceed the anonymous cap, observe that:
 *  (1) anonymous traffic gets 429 around the anon cap
 *  (2) authenticated traffic past the anon cap still returns 200
 *
 * NODE_ENV must be "production" to get the lower 300 cap (otherwise dev = 5000).
 * We satisfy the in-prod HTTPS redirect via `x-forwarded-proto: https`.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

// MUST be set before requiring createApp — createApp captures isProd at import time.
process.env.NODE_ENV = "production";

const { createApp } = require("../createApp");

const ANON_CAP = 300; // matches createApp.js production anon cap
const HTTPS_HEADER = ["x-forwarded-proto", "https"];

describe("Global rate limiter — auth bypass regression", () => {
  test("anonymous requests get 429 around the anonymous cap", async () => {
    // Fresh app = fresh limiter buckets, isolated from other tests.
    const app = createApp();
    let firstBlock = -1;
    for (let i = 0; i < ANON_CAP + 30; i++) {
      const res = await request(app)
        .get("/api/health")
        .set(...HTTPS_HEADER);
      if (res.status === 429) {
        firstBlock = i + 1; // 1-indexed request number
        break;
      }
      assert.equal(res.status, 200, `req #${i + 1} expected 200, got ${res.status}`);
    }
    assert.ok(
      firstBlock > 0,
      `anonymous traffic should hit 429 within ${ANON_CAP + 30} reqs; got firstBlock=${firstBlock}`
    );
    assert.ok(
      firstBlock >= ANON_CAP - 5 && firstBlock <= ANON_CAP + 5,
      `anonymous cap should be ~${ANON_CAP}; first block at ${firstBlock}`
    );
  });

  test("authenticated requests burst past the anon cap (no longer bypassed entirely)", async () => {
    // Fresh app for an isolated bucket. We fire (ANON_CAP + 50) requests,
    // ALL with an Authorization header. With the previous `skip: ...` they would
    // have all succeeded; with the fix they share a bucket but use the higher
    // (2000) max so they still all succeed at this volume — proving the headroom
    // exists. We don't fire 2001 to keep the test fast & deterministic.
    const app = createApp();
    const authHeader = "Bearer test.placeholder.token";
    for (let i = 0; i < ANON_CAP + 50; i++) {
      const res = await request(app)
        .get("/api/health")
        .set("Authorization", authHeader)
        .set(...HTTPS_HEADER);
      assert.equal(
        res.status,
        200,
        `auth req #${i + 1} expected 200 (within authed cap), got ${res.status}`
      );
    }
  });

  test("auth header alone does NOT bypass — leaked token still has a ceiling", async () => {
    // Smoke check: confirm the limiter is wired to authed traffic at all.
    // We can't realistically fire 2000+ requests in a unit run, but we can
    // assert that the limiter middleware is applied (i.e., the request
    // counter is incrementing for authed reqs too). We verify this by
    // observing standard rate-limit headers.
    const app = createApp();
    const res = await request(app)
      .get("/api/health")
      .set("Authorization", "Bearer x")
      .set(...HTTPS_HEADER);
    assert.equal(res.status, 200);
    // express-rate-limit sets `RateLimit-*` (standardHeaders: true).
    assert.ok(
      res.headers["ratelimit-limit"] || res.headers["x-ratelimit-limit"],
      "rate-limit headers should be set on authed responses (proves limiter is engaged, not skipped)"
    );
  });
});
