const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../createApp");

test("one trusted ingress separates clients and ignores forged leftmost addresses", async () => {
  const before = { NODE_ENV: process.env.NODE_ENV, TRUST_PROXY: process.env.TRUST_PROXY };
  process.env.NODE_ENV = "production";
  process.env.TRUST_PROXY = "1";
  try {
    const app = createApp();
    const get = (forwarded) => request(app).get("/api/health")
      .set("X-Forwarded-Proto", "https").set("X-Forwarded-For", forwarded);
    const first = await get("198.51.100.10");
    assert.equal(first.status, 200);
    const remaining = Number(first.headers["ratelimit-remaining"]);
    const spoofed = await get("203.0.113.99, 198.51.100.10");
    assert.equal(Number(spoofed.headers["ratelimit-remaining"]), remaining - 1);
    const other = await get("198.51.100.20");
    assert.equal(Number(other.headers["ratelimit-remaining"]), remaining);
    for (let i = 0; i < 298; i++) await get("198.51.100.10");
    assert.equal((await get("203.0.113.77, 198.51.100.10")).status, 429);
    assert.equal((await get("198.51.100.20")).status, 200);
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
