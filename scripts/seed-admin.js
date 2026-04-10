/**
 * Create or update the admin user for /admin/login.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_USERNAME=admin ADMIN_PASSWORD='secret' node scripts/seed-admin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !username || !password) {
    console.error(
      "Set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD in the environment or .env"
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
