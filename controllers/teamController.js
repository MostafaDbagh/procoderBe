const Team = require("../models/Team");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");
const { destroyTeamMemberPhoto } = require("../utils/teamPhotoCloudinary");
const { uploadUsesCloudinary } = require("../middleware/teamPhotoUpload");

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file (use field name photo)" });
    }
    if (uploadUsesCloudinary()) {
      const photoUrl = req.file.path;
      const photoPublicId = req.file.filename;
      return res.status(201).json({ photoUrl, photoPublicId });
    }
    const photoUrl = `/uploads/team/${req.file.filename}`;
    res.status(201).json({ photoUrl, photoPublicId: "" });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.list = async (req, res) => {
  try {
    const members = await Team.find({ isActive: true })
      .sort({ order: 1 })
      .select("-photoPublicId")
      .lean();
    res.json(members);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.listAdmin = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 15,
      maxLimit: 100,
    });
    const [total, members] = await Promise.all([
      Team.countDocuments(filter),
      Team.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({
      items: members,
      ...paginationMeta(total, page, limit),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.getById = async (req, res) => {
  try {
    const member = await Team.findOne({
      _id: req.params.id,
      isActive: true,
    }).select("-photoPublicId");
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
    const existing = await Team.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Team member not found" });
    }

    const oldPid = String(existing.photoPublicId || "").trim();
    if (oldPid) {
      const urlCleared =
        Object.prototype.hasOwnProperty.call(req.body, "photoUrl") &&
        String(req.body.photoUrl || "").trim() === "";
      const newPidRaw = Object.prototype.hasOwnProperty.call(
        req.body,
        "photoPublicId"
      )
        ? String(req.body.photoPublicId || "").trim()
        : null;

      if (urlCleared) {
        await destroyTeamMemberPhoto(oldPid);
      } else if (newPidRaw !== null && newPidRaw !== oldPid && newPidRaw) {
        await destroyTeamMemberPhoto(oldPid);
      } else if (
        newPidRaw !== null &&
        newPidRaw === "" &&
        Object.prototype.hasOwnProperty.call(req.body, "photoUrl")
      ) {
        const u = String(req.body.photoUrl || "").trim();
        if (u && !u.includes("res.cloudinary.com")) {
          await destroyTeamMemberPhoto(oldPid);
        }
      }
    }

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
    const existing = await Team.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Team member not found" });
    }
    if (existing.photoPublicId) {
      await destroyTeamMemberPhoto(existing.photoPublicId);
    }
    await Team.findByIdAndUpdate(req.params.id, {
      isActive: false,
      photoUrl: "",
      photoPublicId: "",
    });
    res.json({ message: "Team member deactivated" });
  } catch (error) {
    sendServerError(res, error);
  }
};
