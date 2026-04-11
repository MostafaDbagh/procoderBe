const Category = require("../models/Category");
const defaultCategories = require("../data/defaultCategories");

/**
 * Ensures baseline category slugs exist (idempotent inserts only).
 */
async function ensureDefaultCategories() {
  if (process.env.AUTO_SEED_DEFAULT_CATEGORIES === "0") return;

  for (const row of defaultCategories) {
    const exists = await Category.findOne({ slug: row.slug }).lean();
    if (!exists) {
      await Category.create({
        ...row,
        isActive: true,
      });
    }
  }
}

module.exports = ensureDefaultCategories;
