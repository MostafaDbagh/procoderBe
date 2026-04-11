const test = require("node:test");
const assert = require("node:assert/strict");
const {
  committedRevenueByCurrency,
  committedSubtotalsByCourse,
} = require("../utils/catalogRevenueEstimate");

const courses = {
  "algo-intro": { price: 100, currency: "USD" },
  "robotics-a": { price: 50, currency: "USD" },
  "arabic-reading": { price: 200, currency: "USD" },
};

test("committed revenue sums unit-after-catalog-discount for confirmed/active/completed", () => {
  const enrollments = [
    { courseId: "algo-intro", status: "confirmed" },
    { courseId: "algo-intro", status: "pending" },
    { courseId: "robotics-a", status: "active" },
    { courseId: "arabic-reading", status: "completed" },
    { courseId: "arabic-reading", status: "cancelled" },
  ];
  const by = committedRevenueByCurrency(enrollments, courses);
  assert.equal(by.USD, 350);
});

test("committed subtotals by course match count × unit price", () => {
  const enrollments = [
    { courseId: "algo-intro", status: "confirmed" },
    { courseId: "algo-intro", status: "active" },
    { courseId: "robotics-a", status: "completed" },
  ];
  const sub = committedSubtotalsByCourse(enrollments, courses);
  assert.deepEqual(sub["algo-intro"], {
    count: 2,
    unitPrice: 100,
    currency: "USD",
    subtotal: 200,
  });
  assert.deepEqual(sub["robotics-a"], {
    count: 1,
    unitPrice: 50,
    currency: "USD",
    subtotal: 50,
  });
});

test("missing course or zero price yields no extra total", () => {
  const by = committedRevenueByCurrency(
    [{ courseId: "unknown", status: "confirmed" }],
    courses
  );
  assert.deepEqual(by, {});
});

test("catalog discountPercent reduces committed unit revenue", () => {
  const withDisc = {
    ...courses,
    "algo-intro": { price: 100, currency: "USD", discountPercent: 20 },
  };
  const by = committedRevenueByCurrency(
    [{ courseId: "algo-intro", status: "confirmed" }],
    withDisc
  );
  assert.equal(by.USD, 80);
});
