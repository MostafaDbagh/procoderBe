/**
 * Seeds the Team collection with default roster when empty.
 * Replace all: FORCE_TEAM_SEED=1 npm run seed:team
 *
 * Public list: GET /api/team (used by Next.js ISR via getTeamPublicISR).
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Team = require("../models/Team");
const defaultTeam = require("../data/defaultTeam");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  const force = process.env.FORCE_TEAM_SEED === "1";

  await mongoose.connect(uri);
  try {
    const count = await Team.countDocuments();
    if (count > 0 && !force) {
      console.log(
        `Skipping team seed: ${count} member(s) already in DB. Set FORCE_TEAM_SEED=1 to delete all and re-insert defaults.`
      );
      return;
    }
    if (force) {
      await Team.deleteMany({});
      console.log("Cleared existing team members (FORCE_TEAM_SEED=1).");
    }
    await Team.insertMany(defaultTeam);
    console.log(`Seeded ${defaultTeam.length} team member(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
