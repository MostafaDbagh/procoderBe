const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const Note = require("../models/Note");
const Payment = require("../models/Payment");
const Homework = require("../models/Homework");
const Referral = require("../models/Referral");
const { sendServerError } = require("../utils/safeErrorResponse");

exports.detail = async (req, res) => {
 try {
 const enrollment = await Enrollment.findById(req.params.id).lean();
 if (!enrollment) {
 return res.status(404).json({ message: "Enrollment not found" });
 }

 const email = String(enrollment.email || "").toLowerCase().trim();
 const linkedUser = await User.findOne({ email })
 .select("-password")
 .lean();

 const instructorNotes = await Note.find({ enrollment: enrollment._id })
 .sort({ createdAt: -1 })
 .limit(100)
 .lean();

 res.json({
 enrollment,
 linkedUser: linkedUser
 ? {
 _id: linkedUser._id,
 name: linkedUser.name,
 email: linkedUser.email,
 phone: linkedUser.phone,
 role: linkedUser.role,
 isActive: linkedUser.isActive !== false,
 children: linkedUser.children || [],
 specialties: linkedUser.specialties,
 bio: linkedUser.bio,
 assignedCourses: linkedUser.assignedCourses,
 createdAt: linkedUser.createdAt,
 }
 : null,
 instructorNotes,
 });
 } catch (error) {
 sendServerError(res, error);
 }
};

exports.remove = async (req, res) => {
 try {
 const enrollment = await Enrollment.findById(req.params.id);
 if (!enrollment) {
 return res.status(404).json({ message: "Enrollment not found" });
 }

 const enrollmentId = enrollment._id;

 // Cascade: revenue stats aggregate over Enrollment + Payment live, so deleting
 // the enrollment alone isn't enough — its Payments must go too for revenue to update.
 await Promise.all([
 Payment.deleteMany({ enrollment: enrollmentId }),
 Note.deleteMany({ enrollment: enrollmentId }),
 Homework.deleteMany({ enrollment: enrollmentId }),
 Referral.updateMany(
 { "referrals.enrollmentId": enrollmentId },
 { $pull: { referrals: { enrollmentId } } }
 ),
 ]);

 await enrollment.deleteOne();

 res.json({ ok: true });
 } catch (error) {
 sendServerError(res, error);
 }
};
