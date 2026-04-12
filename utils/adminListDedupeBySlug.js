/**
 * Aggregation stages: one row per `slug`, keeping the document with the latest updatedAt.
 * Use after optional $match so filters apply before collapsing duplicates.
 */
function dedupeBySlugKeepNewest() {
  return [
    { $sort: { updatedAt: -1 } },
    { $group: { _id: "$slug", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
  ];
}

module.exports = { dedupeBySlugKeepNewest };
