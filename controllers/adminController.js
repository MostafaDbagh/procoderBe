const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Contact = require("../models/Contact");
const Course = require("../models/Course");
const Team = require("../models/Team");
const MonthlyChallenge = require("../models/MonthlyChallenge");

exports.overview = async (req, res) => {
  try {
    const [
      usersByRole,
      enrollmentByStatus,
      enrollmentByCourse,
      contactsTotal,
      contactsNew,
      coursesActive,
      coursesTotal,
      teamActive,
      teamTotal,
      challengesTotal,
      challengesPublished,
      challengeSignups,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Enrollment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Enrollment.aggregate([
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Contact.countDocuments(),
      Contact.countDocuments({ status: "new" }),
      Course.countDocuments({ isActive: true }),
      Course.countDocuments(),
      Team.countDocuments({ isActive: true }),
      Team.countDocuments(),
      MonthlyChallenge.countDocuments(),
      MonthlyChallenge.countDocuments({ isPublished: true }),
      Contact.countDocuments({
        subject: { $regex: /\[ProCoder Challenge\]/i },
      }),
    ]);

    const usersTotal = await User.countDocuments();

    res.json({
      users: {
        total: usersTotal,
        byRole: usersByRole.reduce((acc, r) => {
          acc[r._id || "unknown"] = r.count;
          return acc;
        }, {}),
      },
      enrollments: {
        total: enrollmentByStatus.reduce((s, x) => s + x.count, 0),
        byStatus: enrollmentByStatus.reduce((acc, r) => {
          acc[r._id || "unknown"] = r.count;
          return acc;
        }, {}),
        byCourseId: enrollmentByCourse.map((r) => ({
          courseId: r._id,
          count: r.count,
        })),
      },
      contacts: { total: contactsTotal, new: contactsNew },
      courses: { active: coursesActive, total: coursesTotal },
      team: { active: teamActive, total: teamTotal },
      challenges: {
        records: challengesTotal,
        published: challengesPublished,
        emailSignups: challengeSignups,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
