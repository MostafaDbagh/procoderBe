const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Note = require("../models/Note");
const Homework = require("../models/Homework");
const Team = require("../models/Team");
const { sendServerError } = require("../utils/safeErrorResponse");

function requireInstructor(req, res) {
 if (req.user.role !== "instructor" && req.user.role !== "admin") {
 res.status(403).json({ message: "Instructor access required" });
 return false;
 }
 return true;
}

/**
 * Course slugs this user may teach.
 * Checks three sources:
 *   1. User.assignedCourses (slug list on the user doc)
 *   2. Course.instructors containing the User _id directly
 *   3. Course.instructors containing a Team member _id whose name matches the user's name
 *      (legacy: admin UI used to assign Team members instead of User accounts)
 */
async function getInstructorCourseSlugs(userId, assignedCourses, userName) {
 const fromUser = Array.isArray(assignedCourses) ? assignedCourses : [];

 // Source 2: courses that directly reference this User ID
 const byUserId = await Course.find({ instructors: userId }).select("slug");

 // Source 3: courses assigned via matching Team member name (legacy Team-ID assignments)
 let byTeamId = [];
 if (userName) {
  const nameRegex = new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  const teamMatches = await Team.find({ "name.en": nameRegex }).select("_id");
  if (teamMatches.length > 0) {
   const teamIds = teamMatches.map((t) => t._id);
   byTeamId = await Course.find({ instructors: { $in: teamIds } }).select("slug");
  }
 }

 const fromDoc = [
  ...byUserId.map((c) => c.slug),
  ...byTeamId.map((c) => c.slug),
 ];
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

 const assignedSlugs = await getInstructorCourseSlugs(user._id, user.assignedCourses, user.name);
 const courses = await Course.find({ slug: { $in: assignedSlugs } });
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
 const allowedSlugs = await getInstructorCourseSlugs(req.user.id, instructorUser.assignedCourses, instructorUser.name);
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
      const instructorUser = await User.findById(req.user.id).select("name assignedCourses");
      const allowedSlugs = await getInstructorCourseSlugs(req.user.id, instructorUser?.assignedCourses, instructorUser?.name);
      if (!allowedSlugs.includes(enrollment.courseId)) {
        return res.status(403).json({ message: "You can only update students in your courses" });
      }
    }

    const { lessonsDone, nextSession, addBadge, removeBadge, addRecording, removeRecordingId, preferredDays, preferredTime } = req.body;

    if (typeof lessonsDone === "number") {
      const course = await Course.findOne({ slug: enrollment.courseId }).select("lessons").lean();
      const maxLessons = course?.lessons || Infinity;
      enrollment.lessonsDone = Math.min(Math.max(0, lessonsDone), maxLessons);
    }
    if (nextSession !== undefined) enrollment.nextSession = nextSession ? new Date(nextSession) : null;
    if (Array.isArray(preferredDays)) {
      enrollment.preferredDays = preferredDays;
      enrollment.markModified("preferredDays");
    }
    if (typeof preferredTime === "string") enrollment.preferredTime = preferredTime;
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
      preferredDays: enrollment.preferredDays,
      preferredTime: enrollment.preferredTime,
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

/**
 * POST /api/instructor/homework
 * Create a homework assignment for a student.
 */
exports.createHomework = async (req, res) => {
  if (!requireInstructor(req, res)) return;
  try {
    const { enrollmentId, title, description, dueDate } = req.body;
    if (!enrollmentId || !title) {
      return res.status(400).json({ message: "enrollmentId and title are required" });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    const instructorUser = await User.findById(req.user.id).select("name assignedCourses");
    if (!instructorUser) return res.status(404).json({ message: "Instructor not found" });

    if (req.user.role !== "admin") {
      const allowedSlugs = await getInstructorCourseSlugs(req.user.id, instructorUser.assignedCourses, instructorUser.name);
      if (!allowedSlugs.includes(enrollment.courseId)) {
        return res.status(403).json({ message: "You can only assign homework for students in your courses" });
      }
    }

    const hw = await Homework.create({
      instructor: req.user.id,
      instructorName: instructorUser.name,
      enrollment: enrollmentId,
      courseId: enrollment.courseId,
      childName: enrollment.childName,
      parentEmail: enrollment.email,
      title: title.trim(),
      description: (description || "").trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json(hw);
  } catch (error) {
    sendServerError(res, error);
  }
};

/**
 * GET /api/instructor/homework
 * List all homework assigned by this instructor.
 */
exports.listHomework = async (req, res) => {
  if (!requireInstructor(req, res)) return;
  try {
    const filter = { instructor: req.user.id };
    if (req.query.enrollmentId) filter.enrollment = req.query.enrollmentId;
    const hw = await Homework.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(hw);
  } catch (error) {
    sendServerError(res, error);
  }
};

/**
 * PATCH /api/instructor/homework/:id
 * Update homework (title, description, dueDate, status, grade, feedback).
 */
exports.updateHomework = async (req, res) => {
  if (!requireInstructor(req, res)) return;
  try {
    const hw = await Homework.findOne({ _id: req.params.id, instructor: req.user.id });
    if (!hw) return res.status(404).json({ message: "Homework not found" });

    const { title, description, dueDate, status, grade, feedback } = req.body;
    if (title !== undefined) hw.title = title.trim();
    if (description !== undefined) hw.description = description.trim();
    if (dueDate !== undefined) hw.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined && ["assigned", "submitted", "graded"].includes(status)) hw.status = status;
    if (grade !== undefined) hw.grade = grade.trim();
    if (feedback !== undefined) hw.feedback = feedback.trim();

    await hw.save();
    res.json(hw);
  } catch (error) {
    sendServerError(res, error);
  }
};

/**
 * DELETE /api/instructor/homework/:id
 */
exports.deleteHomework = async (req, res) => {
  if (!requireInstructor(req, res)) return;
  try {
    const hw = await Homework.findOneAndDelete({ _id: req.params.id, instructor: req.user.id });
    if (!hw) return res.status(404).json({ message: "Homework not found" });
    res.json({ message: "Homework deleted" });
  } catch (error) {
    sendServerError(res, error);
  }
};
