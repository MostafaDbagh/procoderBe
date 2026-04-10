const Team = require("../models/Team");
const { sendServerError } = require("../utils/safeErrorResponse");

exports.list = async (req, res) => {
  try {
    const members = await Team.find({ isActive: true }).sort({ order: 1 });
    res.json(members);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.listAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  try {
    const { active } = req.query;
    const filter = {};
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;
    const members = await Team.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(members);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getById = async (req, res) => {
  try {
    const member = await Team.findOne({
      _id: req.params.id,
      isActive: true,
    });
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json(member);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.create = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const member = await Team.create(req.body);
    res.status(201).json(member);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.update = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const member = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json(member);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.remove = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const member = await Team.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ message: "Team member deactivated" });
  } catch (error) {
    sendServerError(res, error);
  }
};
