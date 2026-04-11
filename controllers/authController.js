const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendServerError } = require("../utils/safeErrorResponse");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username || undefined,
  role: user.role,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, phone });
    const token = signToken(user);

    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    sendServerError(res, error);
  }
};

/** Admin dashboard: requires email + username + password to all match an admin user. */
exports.adminLogin = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: "Email, username, and password are required" });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
      role: "admin",
    }).select("+password");

    if (!user || !user.username) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    if (
      user.username.toLowerCase() !== String(username).toLowerCase().trim()
    ) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    sendServerError(res, error);
  }
};
