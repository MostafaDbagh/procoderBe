/**
 * Deletes all application collections in the MongoDB database from MONGODB_URI
 * (users, enrollments, courses, contacts, team, challenges, payments, etc.).
 *
 * Uses per-collection drop (works on MongoDB Atlas where dropDatabase is often denied).
 *
 * NEVER run against production unless you intend to lose all data.
 *
 *   CONFIRM_RESET_DB=1 npm run db:reset
 *   npm run db:reset -- --yes
 *
 * Production (extra guard):
 *
 *   CONFIRM_RESET_DB=1 ALLOW_PROD_DB_RESET=1 NODE_ENV=production npm run db:reset
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

const confirmed =
  process.env.CONFIRM_RESET_DB === "1" || process.argv.includes("--yes");
if (!confirmed) {
  console.error(`Refusing to wipe the database.

This deletes EVERYTHING in the DB from MONGODB_URI (users, enrollments, courses, etc.).

To confirm, run:
  CONFIRM_RESET_DB=1 npm run db:reset
or:
  npm run db:reset -- --yes
`);
  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_PROD_DB_RESET !== "1"
) {
  console.error(`Refusing: NODE_ENV=production. If you really mean it:
  CONFIRM_RESET_DB=1 ALLOW_PROD_DB_RESET=1 NODE_ENV=production npm run db:reset
`);
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const name = db.databaseName;
  const collections = await db.listCollections().toArray();
  const toDrop = collections
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  console.log(
    `Removing ${toDrop.length} collection(s) from database "${name}"…`
  );
  for (const collName of toDrop) {
    await db.collection(collName).drop();
    console.log(`  dropped: ${collName}`);
  }
  console.log("Done. All listed collections are gone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
