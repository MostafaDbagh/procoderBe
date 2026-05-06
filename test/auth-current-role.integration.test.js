/**
 * Auth middleware must authorize from the current database user, not stale JWT role claims.
 * Run: `SUPPRESS_CLOUDINARY_MISSING_WARN=1 node --test test/auth-current-role.integration.test.js`
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { createApp } = require("../createApp");
const User = require("../models/User");

const canRun =
  Boolean(process.env.MONGODB_URI) &&
  String(process.env.JWT_SECRET || "").length >= 16;

function signRoleClaim(user, role) {
  return jwt.sign(
    { id: user._id.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe("Auth middleware uses current DB role", { skip: !canRun }, () => {
  const app = createApp();
  let suffix;
  let demotedAdmin;
  let promotedParent;
  let inactiveAdmin;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    suffix = `role-${Date.now()}`;

    demotedAdmin = await User.create({
      name: "Stale Token Demoted Admin",
      email: `demoted-${suffix}@test.local`,
      username: `demoted${suffix}`,
      password: "RoleTestAdm1!",
      role: "parent",
    });

    promotedParent = await User.create({
      name: "Current DB Admin",
      email: `promoted-${suffix}@test.local`,
      username: `promoted${suffix}`,
      password: "RoleTestAdm1!",
      role: "admin",
    });

    inactiveAdmin = await User.create({
      name: "Inactive DB Admin",
      email: `inactive-${suffix}@test.local`,
      username: `inactive${suffix}`,
      password: "RoleTestAdm1!",
      role: "admin",
      isActive: false,
    });
  });

  after(async () => {
    if (!canRun) return;
    await User.deleteMany({
      _id: {
        $in: [demotedAdmin?._id, promotedParent?._id, inactiveAdmin?._id].filter(Boolean),
      },
    });
    await mongoose.connection.close();
  });

  test("admin claim in JWT is rejected when DB role is parent", async () => {
    const staleAdminToken = signRoleClaim(demotedAdmin, "admin");
    const res = await request(app)
      .get("/api/admin/overview")
      .set(authHeader(staleAdminToken));

    assert.equal(res.status, 403);
    assert.match(res.body.message || "", /admin/i);
  });

  test("parent claim in JWT is accepted for admin route when DB role is admin", async () => {
    const staleParentToken = signRoleClaim(promotedParent, "parent");
    const res = await request(app)
      .get("/api/admin/overview")
      .set(authHeader(staleParentToken));

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(typeof res.body.users?.total === "number");
  });

  test("active admin claim is still rejected when DB account is inactive", async () => {
    const inactiveToken = signRoleClaim(inactiveAdmin, "admin");
    const res = await request(app)
      .get("/api/admin/overview")
      .set(authHeader(inactiveToken));

    assert.equal(res.status, 401);
    assert.match(res.body.message || "", /deactivated/i);
  });
});
