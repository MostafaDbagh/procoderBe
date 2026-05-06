const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Note = require("../models/Note");
const Homework = require("../models/Homework");
const ParentFeedback = require("../models/ParentFeedback");
const { sendServerError } = require("../utils/safeErrorResponse");

const PARENT_PORTAL_ROLES = ["parent", "student"];
const PARENT_PORTAL_FORBIDDEN =
 "This area is for parents and students. Instructors and admins should use the instructor portal.";

function assertParentPortalUser(user, res) {
 if (!user) {
 res.status(404).json({ message: "User not found" });
 return false;
 }
 if (!PARENT_PORTAL_ROLES.includes(user.role)) {
 res.status(403).json({ message: PARENT_PORTAL_FORBIDDEN });
 return false;
 }
 return true;
}

/**
 * GET /api/parent/dashboard
 * Returns full parent dashboard data: profile, children, enrollments with course info, stats.
 */
exports.dashboard = async (req, res) => {
 try {
 const user = await User.findById(req.user.id).select("-password");
 if (!assertParentPortalUser(user, res)) return;

 // All enrollments for this account: same email and/or linked at signup (multi-child families)
 const enrollments = await Enrollment.find({
 $or: [{ email: user.email }, { user: user._id }],
 }).sort({ createdAt: -1 }).limit(200).lean();

 // Get course details for each enrollment
 const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
 const courses = await Course.find({ slug: { $in: courseIds }, isActive: true })
 .select("slug title description category level lessons durationWeeks iconName color")
 .lean();
 const courseMap = {};
 courses.forEach((c) => {
 courseMap[c.slug] = {
 slug: c.slug,
 title: c.title,
 description: c.description,
 category: c.category,
 level: c.level,
 lessons: c.lessons,
 durationWeeks: c.durationWeeks,
 iconName: c.iconName,
 color: c.color,
 };
 });

 // Enrich enrollments with course data
 const enrichedEnrollments = enrollments.map((e) => ({
 ...e,
 course: courseMap[e.courseId] || null,
 }));

 // Compute stats
 const activeEnrollments = enrollments.filter((e) => ["active", "confirmed"].includes(e.status));
 const completedEnrollments = enrollments.filter((e) => e.status === "completed");
 const totalLessons = courses.reduce((sum, c) => {
 const enrolled = enrollments.find((e) => e.courseId === c.slug && ["pending", "active", "confirmed", "completed"].includes(e.status));
 return sum + (enrolled ? c.lessons : 0);
 }, 0);

 const lessonsDone = enrollments.reduce((sum, e) => sum + (e.lessonsDone || 0), 0);
 const totalBadges = enrollments.reduce((sum, e) => sum + (e.badges ? e.badges.length : 0), 0);

 const stats = {
 coursesEnrolled: enrollments.filter((e) => ["pending", "active", "confirmed", "completed"].includes(e.status)).length,
 activeCourses: activeEnrollments.length,
 completedCourses: completedEnrollments.length,
 totalLessons,
 lessonsCompleted: lessonsDone,
 badges: totalBadges,
 streak: Math.min(activeEnrollments.length * 4, 30),
 };

 // Get recommended courses (ones not yet enrolled in)
 const enrolledSlugs = new Set(enrollments.map((e) => e.courseId));
 const recommended = await Course.find({
 isActive: true,
 slug: { $nin: [...enrolledSlugs] },
 })
 .select("slug title description category level lessons durationWeeks iconName color enrollmentCount price currency discountPercent imageUrl")
 .sort({ enrollmentCount: -1 })
 .limit(4)
 .lean();

 // Get instructor notes for this parent
 const notes = await Note.find({ parentEmail: user.email })
 .sort({ createdAt: -1 })
 .limit(30);

 // Mark unread notes as read
 const unreadIds = notes.filter((n) => !n.readByParent).map((n) => n._id);
 if (unreadIds.length > 0) {
 await Note.updateMany({ _id: { $in: unreadIds } }, { readByParent: true });
 }

 res.json({
 profile: {
 id: user._id,
 name: user.name,
 email: user.email,
 phone: user.phone,
 role: user.role,
 children: user.children || [],
 createdAt: user.createdAt,
 },
 stats,
 enrollments: enrichedEnrollments,
 notes,
 unreadNotes: unreadIds.length,
 recommended,
 });
 } catch (error) {
 sendServerError(res, error);
 }
};

/**
 * PUT /api/parent/children
 * Add or update children on parent profile.
 */
exports.updateChildren = async (req, res) => {
 try {
 const { children } = req.body;
 if (!Array.isArray(children)) {
 return res.status(400).json({ message: "children must be an array" });
 }

 const existing = await User.findById(req.user.id).select("-password");
 if (!assertParentPortalUser(existing, res)) return;

 const user = await User.findByIdAndUpdate(
 req.user.id,
 { children },
 { new: true, runValidators: true }
 ).select("-password");

 res.json({ children: user.children });
 } catch (error) {
 sendServerError(res, error);
 }
};

/**
 * PUT /api/parent/profile
 * Update parent's own profile (name, phone).
 */
exports.updateProfile = async (req, res) => {
 try {
 const { name, phone } = req.body;
 const update = {};
 if (name) update.name = name;
 if (phone) update.phone = phone;

 const existing = await User.findById(req.user.id).select("-password");
 if (!assertParentPortalUser(existing, res)) return;

 const user = await User.findByIdAndUpdate(req.user.id, update, {
 new: true,
 runValidators: true,
 }).select("-password");

 res.json(user);
 } catch (error) {
 sendServerError(res, error);
 }
};

/**
 * GET /api/parent/homework
 * Returns all homework for enrollments belonging to this parent.
 */
exports.getHomework = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!assertParentPortalUser(user, res)) return;

    const hw = await Homework.find({ parentEmail: user.email })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Mark unread as read
    const unreadIds = hw.filter((h) => !h.readByParent).map((h) => h._id);
    if (unreadIds.length > 0) {
      await Homework.updateMany({ _id: { $in: unreadIds } }, { readByParent: true });
    }

    res.json({ homework: hw, unreadCount: unreadIds.length });
  } catch (error) {
    sendServerError(res, error);
  }
};

/**
 * POST /api/parent/feedback
 * Authenticated parent/student feedback for admins to review.
 */
exports.submitFeedback = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!assertParentPortalUser(user, res)) return;

    const category = String(req.body.category || "note").trim();
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ message: "Feedback message is required" });
    }

    const feedback = await ParentFeedback.create({
      user: user._id,
      parentName: user.name,
      parentEmail: user.email,
      parentPhone: user.phone || "",
      category,
      message,
    });

    res.status(201).json({
      message: "Feedback sent successfully",
      feedback,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};
