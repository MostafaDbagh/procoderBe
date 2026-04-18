/**
 * Create or update the admin user for /admin/login.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_USERNAME=admin ADMIN_PASSWORD='secret' node scripts/seed-admin.js
 *
 * Local mock (never in production):
 *   npm run seed:admin:mock
 *   MOCK_ADMIN=1 node scripts/seed-admin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const MOCK_DEFAULTS = {
  email: "admin@stemtechlab.local",
  username: "admin",
  password: "StemTechLabMock1!",
  name: "Mock Admin",
};

async function main() {
  const useMock =
    process.env.MOCK_ADMIN === "1" || process.env.MOCK_ADMIN === "true";

  if (useMock && process.env.NODE_ENV === "production") {
    console.error("MOCK_ADMIN is not allowed when NODE_ENV=production.");
    process.exit(1);
  }

  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  let name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (useMock) {
    if (!email) email = MOCK_DEFAULTS.email;
    if (!username) username = MOCK_DEFAULTS.username;
    if (!password) password = MOCK_DEFAULTS.password;
    if (!process.env.ADMIN_NAME?.trim()) name = MOCK_DEFAULTS.name;
    console.warn(
      "[seed-admin] MOCK_ADMIN: using local-only credentials (change in production)."
    );
    console.warn(
      `  Email: ${email}  Username: ${username}  Password: ${password}`
    );
  }

  if (!email || !username || !password) {
    console.error(
      "Set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD in .env — or run MOCK_ADMIN=1 for local mock defaults."
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    user.username = username;
    user.name = name;
    user.password = password;
    await user.save();
    console.log("Updated existing user as admin:", email);
  } else {
    await User.create({
      name,
      email,
      username,
      password,
      role: "admin",
    });
    console.log("Created admin user:", email);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
