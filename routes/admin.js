const express = require("express");
const { body, param, query } = require("express-validator");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const validate = require("../middleware/validate");
const adminController = require("../controllers/adminController");
const adminUserController = require("../controllers/adminUserController");
const adminEnrollmentDetailController = require("../controllers/adminEnrollmentDetailController");
const adminPaymentController = require("../controllers/adminPaymentController");
const promoAdminController = require("../controllers/promoAdminController");

const router = express.Router();

router.get("/overview", auth, adminOnly, adminController.overview);

router.get(
  "/users",
  auth,
  adminOnly,
  validate([
    query("role")
      .optional()
      .isIn(["parent", "student", "instructor", "admin"]),
    query("active").optional().isIn(["true", "false"]),
  ]),
  adminUserController.list
);

router.patch(
  "/users/:id",
  auth,
  adminOnly,
  validate([
    param("id").isMongoId(),
    body("role")
      .optional()
      .isIn(["parent", "student", "instructor", "admin"]),
    body("isActive").optional().isBoolean(),
    body("name").optional().trim().notEmpty(),
    body("phone").optional().trim(),
    body("specialties").optional().isArray(),
    body("bio").optional().trim(),
    body("assignedCourses").optional().isArray(),
  ]),
  adminUserController.patch
);

router.post(
  "/users/:id/reset-password",
  auth,
  adminOnly,
  validate([
    param("id").isMongoId(),
    body("newPassword").trim().isLength({ min: 8 }),
  ]),
  adminUserController.resetPassword
);

router.post(
  "/users/invite-instructor",
  auth,
  adminOnly,
  validate([
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("phone").optional().trim(),
    body("password")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ min: 8 })
      .withMessage("password must be at least 8 characters when set"),
  ]),
  adminUserController.inviteInstructor
);

router.get(
  "/enrollments/:id/detail",
  auth,
  adminOnly,
  validate([param("id").isMongoId()]),
  adminEnrollmentDetailController.detail
);

router.get(
  "/payments",
  auth,
  adminOnly,
  validate([
    query("status")
      .optional()
      .isIn([
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
      ]),
    query("enrollmentId").optional().isMongoId(),
  ]),
  adminPaymentController.list
);

router.post(
  "/payments/manual",
  auth,
  adminOnly,
  validate([
    body("enrollmentId").trim().notEmpty().isMongoId(),
    body("paymentMethod").isIn(["bank_transfer", "paypal"]),
  ]),
  adminPaymentController.recordManualPayment
);

router.patch(
  "/payments/:id",
  auth,
  adminOnly,
  validate([
    param("id").isMongoId(),
    body("status").isIn([
      "pending",
      "processing",
      "succeeded",
      "failed",
      "refunded",
      "partially_refunded",
    ]),
  ]),
  adminPaymentController.updateStatus
);

router.get(
  "/promos",
  auth,
  adminOnly,
  validate([
    query("active").optional().isIn(["true", "false"]),
    query("q").optional().trim(),
  ]),
  promoAdminController.list
);

router.post(
  "/promos",
  auth,
  adminOnly,
  validate([
    body("code").trim().notEmpty(),
    body("discountType").isIn(["percent", "fixed"]),
    body("discountValue").isFloat({ gt: 0 }),
    body("currency")
      .optional()
      .trim()
      .customSanitizer((v) => (v ? String(v).toUpperCase() : v))
      .custom((v) => !v || v === "USD")
      .withMessage("Only USD is supported"),
    body("description").optional().trim(),
    body("maxUses")
      .optional({ nullable: true })
      .custom(
        (v) =>
          v === null ||
          v === undefined ||
          (Number.isInteger(Number(v)) && Number(v) >= 1)
      ),
    body("validFrom")
      .optional({ nullable: true })
      .custom(
        (v) =>
          v === null ||
          v === undefined ||
          !Number.isNaN(Date.parse(String(v)))
      ),
    body("validUntil")
      .optional({ nullable: true })
      .custom(
        (v) =>
          v === null ||
          v === undefined ||
          !Number.isNaN(Date.parse(String(v)))
      ),
    body("courseSlugs").optional().isArray(),
    body("isActive").optional().isBoolean(),
  ]),
  promoAdminController.create
);

router.get(
  "/promos/:id",
  auth,
  adminOnly,
  validate([param("id").isMongoId()]),
  promoAdminController.getById
);

router.patch(
  "/promos/:id",
  auth,
  adminOnly,
  validate([
    param("id").isMongoId(),
    body("discountType").optional().isIn(["percent", "fixed"]),
    body("discountValue").optional().isFloat({ gt: 0 }),
    body("currency")
      .optional()
      .trim()
      .customSanitizer((v) => (v ? String(v).toUpperCase() : v))
      .custom((v) => !v || v === "USD")
      .withMessage("Only USD is supported"),
    body("description").optional().trim(),
    body("maxUses")
      .optional({ nullable: true })
      .custom(
        (v) =>
          v === null ||
          v === undefined ||
          (Number.isInteger(Number(v)) && Number(v) >= 1)
      ),
    body("validFrom")
      .optional({ nullable: true })
      .custom(
        (v) =>
          v === null ||
          v === undefined ||
          !Number.isNaN(Date.parse(String(v)))
      ),
    body("validUntil")
      .optional({ nullable: true })
      .custom(
        (v) =>
          v === null ||
          v === undefined ||
          !Number.isNaN(Date.parse(String(v)))
      ),
    body("courseSlugs").optional().isArray(),
    body("isActive").optional().isBoolean(),
  ]),
  promoAdminController.patch
);

router.delete(
  "/promos/:id",
  auth,
  adminOnly,
  validate([param("id").isMongoId()]),
  promoAdminController.remove
);

module.exports = router;
