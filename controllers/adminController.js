const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Contact = require("../models/Contact");
const Course = require("../models/Course");
const Team = require("../models/Team");
const MonthlyChallenge = require("../models/MonthlyChallenge");
const Payment = require("../models/Payment");
const { sendServerError } = require("../utils/safeErrorResponse");

const COURSE_LOOKUP = {
  $lookup: {
    from: "courses",
    localField: "courseId",
    foreignField: "slug",
    as: "_course",
  },
};

const UNWIND_COURSE = {
  $unwind: { path: "$_course", preserveNullAndEmptyArrays: true },
};

/** Per enrollment: prefer stored amountDue; else catalog price after course discountPercent. */
const STAGE_CATALOG_DISCOUNTED = {
  $addFields: {
    _catalogDiscounted: {
      $round: [
        {
          $multiply: [
            { $ifNull: ["$_course.price", 0] },
            {
              $subtract: [
                1,
                {
                  $divide: [
                    { $ifNull: ["$_course.discountPercent", 0] },
                    100,
                  ],
                },
              ],
            },
          ],
        },
        2,
      ],
    },
  },
};

const STAGE_LINE_PRICE = {
  $addFields: {
    _linePrice: {
      $cond: {
        if: { $gt: [{ $ifNull: ["$amountDue", 0] }, 0] },
        then: "$amountDue",
        else: "$_catalogDiscounted",
      },
    },
    _lineCurrency: {
      $toUpper: {
        $ifNull: [
          "$currency",
          { $ifNull: ["$_course.currency", "USD"] },
        ],
      },
    },
  },
};

const REVENUE_AFTER_LOOKUP = [
  COURSE_LOOKUP,
  UNWIND_COURSE,
  STAGE_CATALOG_DISCOUNTED,
  STAGE_LINE_PRICE,
];

function facetToCurrencyMap(rows) {
  return rows.reduce((acc, r) => {
    acc[r._id || "USD"] = Math.round(r.total * 100) / 100;
    return acc;
  }, {});
}

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
      revenueAgg,
      paymentFacet,
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
      Enrollment.aggregate([
        {
          $facet: {
            committedByCurrency: [
              {
                $match: {
                  status: { $in: ["confirmed", "active", "completed"] },
                },
              },
              ...REVENUE_AFTER_LOOKUP,
              {
                $group: {
                  _id: "$_lineCurrency",
                  total: { $sum: "$_linePrice" },
                  enrollmentCount: { $sum: 1 },
                },
              },
            ],
            pipelineByCurrency: [
              { $match: { status: { $ne: "cancelled" } } },
              ...REVENUE_AFTER_LOOKUP,
              {
                $group: {
                  _id: "$_lineCurrency",
                  total: { $sum: "$_linePrice" },
                  enrollmentCount: { $sum: 1 },
                },
              },
            ],
            byCourseCommitted: [
              {
                $match: {
                  status: { $in: ["confirmed", "active", "completed"] },
                },
              },
              ...REVENUE_AFTER_LOOKUP,
              {
                $group: {
                  _id: "$courseId",
                  titleEn: { $first: "$_course.title.en" },
                  currency: { $first: "$_lineCurrency" },
                  subtotal: { $sum: "$_linePrice" },
                  enrollmentCount: { $sum: 1 },
                },
              },
              {
                $addFields: {
                  unitPrice: {
                    $cond: [
                      { $gt: ["$enrollmentCount", 0] },
                      {
                        $round: [
                          { $divide: ["$subtotal", "$enrollmentCount"] },
                          2,
                        ],
                      },
                      0,
                    ],
                  },
                },
              },
              { $sort: { subtotal: -1 } },
              { $limit: 50 },
            ],
          },
        },
      ]),
      Payment.aggregate([
        {
          $facet: {
            succeededByCurrency: [
              { $match: { status: "succeeded" } },
              {
                $group: {
                  _id: "$currency",
                  grossCents: { $sum: "$amountCents" },
                  refundedCents: {
                    $sum: { $ifNull: ["$refundedCents", 0] },
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            countsByStatus: [
              { $group: { _id: "$status", count: { $sum: 1 } } },
            ],
            pendingAmount: [
              { $match: { status: "pending" } },
              { $count: "n" },
            ],
          },
        },
      ]),
    ]);

    const usersTotal = await User.countDocuments();

    const rev = revenueAgg[0] || {
      committedByCurrency: [],
      pipelineByCurrency: [],
      byCourseCommitted: [],
    };

    const committedRows = rev.committedByCurrency || [];
    const pipelineRows = rev.pipelineByCurrency || [];

    const payFacet = paymentFacet[0] || {
      succeededByCurrency: [],
      countsByStatus: [],
      pendingAmount: [],
    };
    const byCur = {};
    for (const r of payFacet.succeededByCurrency || []) {
      const cur = (r._id || "USD").toUpperCase();
      const gross = Math.round(Number(r.grossCents) || 0);
      const ref = Math.round(Number(r.refundedCents) || 0);
      byCur[cur] = {
        gross: gross / 100,
        net: Math.max(0, gross - ref) / 100,
        count: r.count || 0,
      };
    }
    const byStatus = (payFacet.countsByStatus || []).reduce((acc, x) => {
      acc[x._id || "unknown"] = x.count;
      return acc;
    }, {});
    const pendingCount =
      payFacet.pendingAmount && payFacet.pendingAmount[0]
        ? payFacet.pendingAmount[0].n
        : 0;

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
      revenue: {
        note:
          "Uses each enrollment’s course catalog price today (slug match). Mixed currencies are not converted.",
        committed: {
          statuses: ["confirmed", "active", "completed"],
          byCurrency: facetToCurrencyMap(committedRows),
          enrollmentCount: committedRows.reduce(
            (s, r) => s + (r.enrollmentCount || 0),
            0
          ),
        },
        pipeline: {
          statuses: "all except cancelled (includes pending)",
          byCurrency: facetToCurrencyMap(pipelineRows),
          enrollmentCount: pipelineRows.reduce(
            (s, r) => s + (r.enrollmentCount || 0),
            0
          ),
        },
        byCourse: (rev.byCourseCommitted || []).map((r) => ({
          courseSlug: r._id,
          titleEn: r.titleEn || r._id,
          currency: r.currency || "USD",
          unitPrice: Math.round(Number(r.unitPrice || 0) * 100) / 100,
          enrollmentCount: r.enrollmentCount,
          subtotal: Math.round(Number(r.subtotal || 0) * 100) / 100,
        })),
      },
      payments: {
        note:
          "Stripe Checkout / webhooks (succeeded). Catalog revenue above is still an estimate.",
        configured: Boolean(
          process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
        ),
        succeeded: {
          byCurrency: byCur,
          paymentCount: (payFacet.succeededByCurrency || []).reduce(
            (s, r) => s + (r.count || 0),
            0
          ),
        },
        byStatus,
        pendingCheckoutSessions: pendingCount,
      },
    });
  } catch (error) {
    sendServerError(res, error);
  }
};
