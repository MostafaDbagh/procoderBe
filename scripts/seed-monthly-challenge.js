/**
 * Upserts the default paper-pixel-letter challenge so GET /api/challenges/public/latest works.
 * Run: npm run seed:challenge
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MonthlyChallenge = require("../models/MonthlyChallenge");
const base = require("../data/defaultMonthlyChallenge");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  const d = new Date();
  const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  await mongoose.connect(uri);
  try {
    const doc = { ...base, monthKey, isPublished: true };
    const updated = await MonthlyChallenge.findOneAndUpdate(
      { slug: doc.slug },
      { $set: doc },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(
      `Monthly challenge upserted: slug=${updated.slug} monthKey=${updated.monthKey} published=${updated.isPublished}`
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
