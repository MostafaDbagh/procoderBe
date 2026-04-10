const Course = require("../models/Course");
const defaultCourses = require("../data/defaultCourses");

/**
 * If there are no active courses, insert missing catalog rows and set all default slugs active.
 * Safe when the collection is empty or only has inactive rows; does not delete or alter non-catalog courses.
 */
async function ensureDefaultCourses() {
  if (process.env.AUTO_SEED_DEFAULT_COURSES === "0") return;

  const active = await Course.countDocuments({ isActive: true });
  if (active > 0) return;

  const slugs = defaultCourses.map((c) => c.slug);
  const existing = new Set(
    (await Course.find({ slug: { $in: slugs } }, { slug: 1 }).lean()).map((c) => c.slug)
  );
  const toInsert = defaultCourses.filter((c) => !existing.has(c.slug));
  if (toInsert.length) {
    await Course.insertMany(toInsert);
  }
  await Course.updateMany({ slug: { $in: slugs } }, { $set: { isActive: true } });

  const after = await Course.countDocuments({ isActive: true });
  console.log(`[courses] default catalog ensured (${after} active courses)`);
}

module.exports = ensureDefaultCourses;
