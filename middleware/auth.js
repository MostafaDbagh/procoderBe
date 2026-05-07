const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    logger.warn(`[auth] denied: no token | ${req.method} ${req.originalUrl} | IP ${req.ip}`);
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    logger.warn(`[auth] denied: invalid token | ${req.method} ${req.originalUrl} | IP ${req.ip}`);
    return res.status(401).json({ message: "Token is not valid" });
  }

  if (!decoded?.id) {
    return res.status(401).json({ message: "Token is not valid" });
  }

  let u;
  try {
    u = await User.findById(decoded.id)
      .select("isActive role email name username")
      .lean();
  } catch (e) {
    logger.error("[auth] user lookup failed", e);
    return res
      .status(503)
      .json({ message: "Service temporarily unavailable" });
  }

  if (!u) {
    return res.status(401).json({ message: "User not found" });
  }
  if (u.isActive === false) {
    return res.status(401).json({ message: "Account deactivated" });
  }

  req.user = {
    ...decoded,
    id: String(u._id || decoded.id),
    role: u.role,
    email: u.email,
    name: u.name,
    username: u.username,
  };
  next();
};

module.exports = auth;
