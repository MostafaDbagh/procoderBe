const Referral = require("../models/Referral");
const User = require("../models/User");
const { sendServerError } = require("../utils/safeErrorResponse");
const { parsePagination, paginationMeta } = require("../utils/pagination");

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PC-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── PARENT: Get or create my referral code ───

exports.getMyReferral = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    let referral = await Referral.findOne({ referrer: req.user.id });
    if (!referral) {
      let code;
      let attempts = 0;
      do {
        code = generateCode();
        attempts++;
      } while (attempts < 10 && (await Referral.findOne({ code })));

      referral = await Referral.create({
        referrer: req.user.id,
        referrerEmail: user.email,
        referrerName: user.name,
        code,
      });
    }

    res.json({
      code: referral.code,
      discountPercent: referral.discountPercent,
      totalReferred: referral.totalReferred,
      totalRevenueSaved: referral.totalRevenueSaved,
      referrals: referral.referrals,
      isActive: referral.isActive,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

// ─── PUBLIC: Validate referral code ───

exports.validate = async (req, res) => {
  try {
    const code = String(req.params.code || "").trim().toUpperCase();
    const referral = await Referral.findOne({ code, isActive: true });
    if (!referral) return res.status(404).json({ message: "Invalid referral code" });
    if (referral.maxUses && referral.totalReferred >= referral.maxUses) {
      return res.status(400).json({ message: "Referral code has reached its limit" });
    }
    res.json({
      valid: true,
      discountPercent: referral.discountPercent,
      referrerName: referral.referrerName,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

// ─── Record a referral (called internally during enrollment) ───

exports.recordReferral = async (code, { name, email, enrollmentId, courseId, amountSaved }) => {
  try {
    const referral = await Referral.findOne({ code: code.toUpperCase(), isActive: true });
    if (!referral) return null;
    referral.referrals.push({ name, email, enrollmentId, courseId });
    referral.totalReferred += 1;
    referral.totalRevenueSaved += amountSaved || 0;
    await referral.save();
    return referral;
  } catch {
    return null;
  }
};

// ─── ADMIN ───

exports.listAdmin = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 15, maxLimit: 100 });
    const [total, referrals] = await Promise.all([
      Referral.countDocuments(),
      Referral.find()
        .sort({ totalReferred: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({ items: referrals, ...paginationMeta(total, page, limit) });
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { discountPercent, isActive, maxUses } = req.body;
    const update = {};
    if (discountPercent !== undefined) update.discountPercent = Number(discountPercent);
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (maxUses !== undefined) update.maxUses = maxUses === null ? null : Number(maxUses);

    const referral = await Referral.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!referral) return res.status(404).json({ message: "Referral not found" });
    res.json(referral);
  } catch (error) {
    sendServerError(res, error);
  }
};

exports.statsAdmin = async (req, res) => {
  try {
    const [totalCodes, activeStats] = await Promise.all([
      Referral.countDocuments(),
      Referral.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalReferred: { $sum: "$totalReferred" },
            totalSaved: { $sum: "$totalRevenueSaved" },
            activeCodes: { $sum: 1 },
          },
        },
      ]),
    ]);

    const s = activeStats[0] || { totalReferred: 0, totalSaved: 0, activeCodes: 0 };
    res.json({
      totalCodes,
      activeCodes: s.activeCodes,
      totalReferred: s.totalReferred,
      totalRevenueSaved: s.totalSaved,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};
