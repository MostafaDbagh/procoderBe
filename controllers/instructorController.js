const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Note = require("../models/Note");
const { sendServerError } = require("../utils/safeErrorResponse");

function requireInstructor(req, res) {
 if (req.user.role !== "instructor" && req.user.role !== "admin") {
 res.status(403).json({ message: "Instructor access required" });
 return false;
 }
 return true;
}

/** Course slugs this user may teach: Course.instructors array + legacy User.assignedCourses. */
async function getInstructorCourseSlugs(userId, assignedCourses) {
 const fromUser = Array.isArray(assignedCourses) ? assignedCourses : [];
 const courses = await Course.find({ instructors: userId, isActive: true }).select("slug");
 const fromDoc = courses.map((c) => c.slug);
 return [...new Set([...fromUser, ...fromDoc])];
}

/**
 * GET /api/instructor/dashboard
 * Returns instructor profile, assigned courses, students enrolled in those courses.
 */
exports.dashboard = async (req, res) => {
 if (!requireInstructor(req, res)) return;

 try {
 const user = await User.findById(req.user.id).select("-password");
 if (!user) return res.status(404).json({ message: "User not found" });

 const assignedSlugs = await getInstructorCourseSlugs(user._id, user.assignedCourses);
 const courses = await Course.find({ slug: { $in: assignedSlugs }, isActive: true });
 const courseMap = {};
 courses.forEach((c) => { courseMap[c.slug] = c; });

 // Get all enrollments for those courses (active/confirmed)
 const enrollments = await Enrollment.find({
 courseId: { $in: assignedSlugs },
 status: { $in: ["active", "confirmed", "pending"] },
 }).sort({ createdAt: -1 });

 // Get recent notes by this instructor
 const recentNotes = await Note.find({ instructor: req.user.id })
 .sort({ createdAt: -1 })
 .limit(20);

 // Stats
 const totalStudents = enrollments.length;
 const activeStudents = enrollments.filter((e) => e.status === "active").length;
 const pendingStudents = enrollments.filter((e) => e.status === "pending").length;

 res.json({
 profile: {
 id: user._id,
 name: user.name,
 email: user.email,
 specialties: user.specialties || [],
 bio: user.bio || "",
 assignedCourses: assignedSlugs,
 },
 courses: courses.map((c) => ({
 slug: c.slug,
 title: c.title,
 category: c.category,
 level: c.level,
 lessons: c.lessons,
 color: c.color,
 })),
 students: enrollments.map((e) => ({
 enrollmentId: e._id,
 childName: e.childName,
 childAge: e.childAge,
 parentName: e.parentName,
 parentEmail: e.email,
 phone: e.phone,
 courseId: e.courseId,
 courseTitle: e.courseTitle,
 status: e.status,
 preferredDays: e.preferredDays,
 preferredTime: e.preferredTime,
 sessionFormat: e.sessionFormat,
 learningGoals: e.learningGoals,
 specialNeeds: e.specialNeeds,
 createdAt: e.createdAt,
 lessonsDone: e.lessonsDone || 0,
 nextSession: e.nextSession || null,
 badges: e.badges || [],
 recordings: e.recordings || [],
 totalLessons: (courseMap[e.courseId] || {}).lessons || 0,
 })),
 recentNotes,
 stats: {
 totalStudents,
 activeStudents,
 pendingStudents,
 totalCourses: courses.length,
 notesWritten: recentNotes.length,
 },
 });
 } catch (error) {
 sendServerError(res, error);
 }
};

/**
 * POST /api/instructor/notes
 * Create a note for a student (visible to parent).
 */
exports.createNote = async (req, res) => {
 if (!requireInstructor(req, res)) return;

 try {
 const { enrollmentId, type, title, body } = req.body;

 const enrollment = await Enrollment.findById(enrollmentId);
 if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

 const instructorUser = await User.findById(req.user.id).select("name assignedCourses");
 if (!instructorUser) return res.status(404).json({ message: "User not found" });

 if (req.user.role !== "admin") {
 const allowedSlugs = await getInstructorCourseSlugs(req.user.id, instructorUser.assignedCourses);
 if (!allowedSlugs.includes(enrollment.courseId)) {
 return res.status(403).json({ message: "You can only add notes for students in your courses" });
 }
 }

 const instructor = instructorUser;

 const note = await Note.create({
 instructor: req.user.id,
 instructorName: instructor.name,
 enrollment: enrollmentId,
 courseId: enrollment.courseId,
 childName: enrollment.childName,
 parentEmail: enrollment.email,
 type: type || "general",
 title,
 body,
 });

 res.status(201).json(note);
 } catch (error) {
 sendServerError(res, error);
 }
};

/**
 * GET /api/instructor/notes?enrollmentId=xxx
 * Get all notes by this instructor, optionally filtered by enrollment.
 */
exports.listNotes = async (req, res) => {
 if (!requireInstructor(req, res)) return;

 try {
 const filter = { instructor: req.user.id };
 if (req.query.enrollmentId) filter.enrollment = req.query.enrollmentId;
 if (req.query.courseId) filter.courseId = req.query.courseId;

 const notes = await Note.find(filter).sort({ createdAt: -1 }).limit(50);
 res.json(notes);
 } catch (error) {
 res.status(500).json({ message: "Server error" });
 }
};

/**
 * PATCH /api/instructor/students/:enrollmentId
 * Instructor updates progress, next session date, or awards a badge.
 * Body: { lessonsDone?, nextSession?, addBadge? }
 */
exports.updateStudent = async (req, res) => {
  if (!requireInstructor(req, res)) return;
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    if (req.user.role !== "admin") {
      const instructorUser = await User.findById(req.user.id).select("assignedCourses");
      const allowedSlugs = await getInstructorCourseSlugs(req.user.id, instructorUser?.assignedCourses);
      if (!allowedSlugs.includes(enrollment.courseId)) {
        return res.status(403).json({ message: "You can only update students in your courses" });
      }
    }

    const { lessonsDone, nextSession, addBadge, removeBadge, addRecording, removeRecordingId } = req.body;

    if (typeof lessonsDone === "number") {
      const course = await Course.findOne({ slug: enrollment.courseId }).select("lessons").lean();
      const maxLessons = course?.lessons || Infinity;
      enrollment.lessonsDone = Math.min(Math.max(0, lessonsDone), maxLessons);
    }
    if (nextSession !== undefined) enrollment.nextSession = nextSession ? new Date(nextSession) : null;
    if (addBadge && typeof addBadge === "string" && addBadge.trim()) {
      enrollment.badges.push({ name: addBadge.trim(), awardedAt: new Date() });
    }
    if (removeBadge && typeof removeBadge === "string") {
      enrollment.badges = enrollment.badges.filter((b) => b.name !== removeBadge);
    }
    if (addRecording && typeof addRecording.url === "string" && addRecording.url.trim()) {
      enrollment.recordings.push({
        url: addRecording.url.trim(),
        title: typeof addRecording.title === "string" ? addRecording.title.trim() : "",
        sessionDate: addRecording.sessionDate ? new Date(addRecording.sessionDate) : new Date(),
        addedAt: new Date(),
      });
    }
    if (removeRecordingId && typeof removeRecordingId === "string") {
      enrollment.recordings = enrollment.recordings.filter(
        (r) => String(r._id) !== removeRecordingId
      );
    }

    await enrollment.save();
    res.json({
      lessonsDone: enrollment.lessonsDone,
      nextSession: enrollment.nextSession,
      badges: enrollment.badges,
      recordings: enrollment.recordings,
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

/**
 * DELETE /api/instructor/notes/:id
 */
exports.deleteNote = async (req, res) => {
 if (!requireInstructor(req, res)) return;

 try {
 const note = await Note.findOneAndDelete({
 _id: req.params.id,
 instructor: req.user.id,
 });
 if (!note) return res.status(404).json({ message: "Note not found" });
 res.json({ message: "Note deleted" });
 } catch (error) {
 res.status(500).json({ message: "Server error" });
 }
};
