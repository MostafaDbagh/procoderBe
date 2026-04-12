/**
 * Pure unit tests — no database.
 */
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { dedupeBySlugKeepNewest } = require("../utils/adminListDedupeBySlug");

describe("adminListDedupeBySlug", () => {
  test("returns sort, group, replaceRoot stages", () => {
    const stages = dedupeBySlugKeepNewest();
    assert.equal(stages.length, 3);
    assert.deepEqual(stages[0], { $sort: { updatedAt: -1 } });
    assert.ok(stages[1].$group);
    assert.equal(stages[1].$group._id, "$slug");
    assert.ok(stages[1].$group.doc);
    assert.deepEqual(stages[2], { $replaceRoot: { newRoot: "$doc" } });
  });
});
