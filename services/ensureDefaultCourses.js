const Course = require("../models/Course");
const defaultCourses = require("../data/defaultCourses");
const logger = require("../utils/logger");

/**
 * Set catalog price/currency from defaultCourses when a default slug is still free (price ≤ 0).
 * Does not overwrite courses you already priced above zero.
 */
async function syncPricesForFreeDefaultSlugs() {
  for (const c of defaultCourses) {
    const price = Number(c.price);
    const currency = String(c.currency || "USD").toUpperCase();
    if (!Number.isFinite(price) || price <= 0) continue;
    const res = await Course.updateOne(
      {
        slug: c.slug,
        $or: [{ price: { $lte: 0 } }, { price: { $exists: false } }],
      },
      { $set: { price, currency } }
    );
    if (res.modifiedCount > 0) {
      logger.info(`[courses] synced price for ${c.slug}: ${price} ${currency}`);
    }
  }
}

/**
 * If there are no active courses, insert missing catalog rows and set all default slugs active.
 * Safe when the collection is empty or only has inactive rows; does not delete or alter non-catalog courses.
 * After that (or on every boot), updates any default-slug rows that are still priced at 0.
 */
async function ensureDefaultCourses() {
  if (process.env.AUTO_SEED_DEFAULT_COURSES === "0") return;

  const slugs = defaultCourses.map((c) => c.slug);
  const active = await Course.countDocuments({ isActive: true });

  if (active === 0) {
    const existing = new Set(
      (await Course.find({ slug: { $in: slugs } }, { slug: 1 }).lean()).map(
        (c) => c.slug
      )
    );
    const toInsert = defaultCourses.filter((c) => !existing.has(c.slug));
    if (toInsert.length) {
      await Course.insertMany(toInsert);
    }
    await Course.updateMany(
      { slug: { $in: slugs } },
      { $set: { isActive: true } }
    );

    const after = await Course.countDocuments({ isActive: true });
    logger.info(`[courses] default catalog ensured (${after} active courses)`);
  }

  await syncPricesForFreeDefaultSlugs();
}

module.exports = ensureDefaultCourses;
