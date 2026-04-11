const test = require("node:test");
const assert = require("node:assert/strict");
const { priceAfterCourseDiscount, applyPromo } = require("../utils/pricing");

test("priceAfterCourseDiscount", () => {
  assert.equal(
    priceAfterCourseDiscount({ price: 100, discountPercent: 20 }),
    80
  );
  assert.equal(priceAfterCourseDiscount({ price: 100, discountPercent: 0 }), 100);
});

test("applyPromo percent", () => {
  const p = { discountType: "percent", discountValue: 10 };
  const r = applyPromo(80, p, "USD");
  assert.equal(r.final, 72);
  assert.equal(r.saved, 8);
});

test("applyPromo fixed", () => {
  const p = { discountType: "fixed", discountValue: 15, currency: "USD" };
  const r = applyPromo(80, p, "USD");
  assert.equal(r.final, 65);
});
