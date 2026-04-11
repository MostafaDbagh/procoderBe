const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../createApp");

test("GET /api/health returns 200", async () => {
  const app = createApp();
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});

test("POST /api/webhooks/stripe returns 503 when Stripe env not set", async () => {
  const prevKey = process.env.STRIPE_SECRET_KEY;
  const prevWh = process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const app = createApp();
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(Buffer.from("{}"));
    assert.equal(res.status, 503);
  } finally {
    if (prevKey !== undefined) process.env.STRIPE_SECRET_KEY = prevKey;
    if (prevWh !== undefined) process.env.STRIPE_WEBHOOK_SECRET = prevWh;
  }
});

test("POST /api/webhooks/stripe returns 400 when configured but signature invalid", async () => {
  const prevKey = process.env.STRIPE_SECRET_KEY;
  const prevWh = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_construct";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy";
  try {
    const app = createApp();
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=1,v1=deadbeef")
      .send(Buffer.from("{}"));
    assert.equal(res.status, 400);
    assert.match(String(res.text), /Webhook Error/i);
  } finally {
    if (prevKey !== undefined) process.env.STRIPE_SECRET_KEY = prevKey;
    else delete process.env.STRIPE_SECRET_KEY;
    if (prevWh !== undefined) process.env.STRIPE_WEBHOOK_SECRET = prevWh;
    else delete process.env.STRIPE_WEBHOOK_SECRET;
  }
});
