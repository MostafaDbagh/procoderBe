const test = require("node:test");
const assert = require("node:assert/strict");
const {
  summarizeSucceededNetByCurrency,
} = require("../utils/paymentReport");

test("summarizeSucceededNetByCurrency merges currency case and nets refunds", () => {
  const { byCurrency, totalCount } = summarizeSucceededNetByCurrency([
    { currency: "usd", amountCents: 1000, refundedCents: 250 },
    { currency: "USD", amountCents: 500, refundedCents: 0 },
  ]);
  assert.equal(totalCount, 2);
  assert.equal(byCurrency.USD.grossCents, 1500);
  assert.equal(byCurrency.USD.netCents, 1250);
  assert.equal(byCurrency.USD.count, 2);
});

test("summarizeSucceededNetByCurrency treats missing refund as zero", () => {
  const { byCurrency } = summarizeSucceededNetByCurrency([
    { currency: "USD", amountCents: 99 },
  ]);
  assert.equal(byCurrency.USD.netCents, 99);
  assert.equal(byCurrency.USD.grossCents, 99);
});
