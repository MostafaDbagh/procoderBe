const crypto = require("crypto");
const User = require("../models/User");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeUser(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: o._id,
    name: o.name,
    email: o.email,
    username: o.username,
    role: o.role,
    phone: o.phone,
    isActive: o.isActive !== false,
    specialties: o.specialties,
    bio: o.bio,
    assignedCourses: o.assignedCourses,
    children: o.children,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = String(req.query.role);
    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q)), "i");
      filter.$or = [
        { email: rx },
        { name: rx },
        { username: rx },
        { phone: rx },
      ];
    }

    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 15,
      maxLimit: 100,
    });
    const [total, rows] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({
      items: rows.map(safeUser),
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.patch = async (req, res) => {
  try {
    const id = req.params.id;
    const actorId = String(req.user.id);
    if (id === actorId) {
      if (req.body.isActive === false) {
        return res
          .status(400)
          .json({ message: "Cannot deactivate your own account" });
      }
      if (req.body.role && req.body.role !== "admin") {
        return res.status(400).json({ message: "Cannot change your own role" });
      }
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.role != null && req.body.role !== target.role) {
      if (target.role === "admin" && req.body.role !== "admin") {
        const others = await User.countDocuments({
          role: "admin",
          isActive: { $ne: false },
          _id: { $ne: target._id },
        });
        if (others < 1) {
          return res.status(400).json({
            message: "Cannot change role: this is the only active admin",
          });
        }
      }
    }

    if (req.body.isActive === false && target.role === "admin") {
      const others = await User.countDocuments({
        role: "admin",
        isActive: { $ne: false },
        _id: { $ne: target._id },
      });
      if (others < 1) {
        return res.status(400).json({
          message: "Cannot deactivate the only active admin",
        });
      }
    }

    const $set = {};
    if (req.body.name != null) $set.name = String(req.body.name).trim();
    if (req.body.phone != null) $set.phone = String(req.body.phone).trim();
    if (req.body.role != null) $set.role = req.body.role;
    if (req.body.isActive != null) $set.isActive = Boolean(req.body.isActive);
    if (req.body.specialties != null) $set.specialties = req.body.specialties;
    if (req.body.bio != null) $set.bio = String(req.body.bio);
    if (req.body.assignedCourses != null) {
      $set.assignedCourses = req.body.assignedCourses;
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await User.findByIdAndUpdate(id, $set, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(safeUser(updated));
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const newPassword = String(req.body.newPassword || "");
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "newPassword must be at least 8 characters" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated" });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.inviteInstructor = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const phone = req.body.phone ? String(req.body.phone).trim() : undefined;
    let password = req.body.password
      ? String(req.body.password)
      : crypto.randomBytes(12).toString("base64url").slice(0, 14);
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "password must be at least 8 characters if provided" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "instructor",
    });

    const out = {
      user: safeUser(user),
    };
    if (!req.body.password) {
      out.temporaryPassword = password;
    }
    res.status(201).json(out);
  } catch (error) {
    sendServerError(res, error);
  }
};
