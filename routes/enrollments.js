const express = require("express");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const enrollmentController = require("../controllers/enrollmentController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { honeypot, timingGate, enrollmentLimiter } = require("../middleware/antispam");

const router = express.Router();

router.post(
  "/",
  enrollmentLimiter,
  honeypot,
  timingGate(5000),
  validate([
    body("parentName").trim().notEmpty().isLength({ max: 100 }),
    body("email").isEmail(),
    body("phone").trim().notEmpty().matches(/^\+?[\d\s()-]{8,20}$/).withMessage("Invalid phone number format"),
    body("relationship").trim().notEmpty().isLength({ max: 50 }),
    body("childName").trim().notEmpty().isLength({ max: 100 }),
    body("childAge").isInt({ min: 6, max: 18 }),
    body("gradeLevel").trim().notEmpty(),
    body("courseId").trim().notEmpty(),
    body("sessionFormat").trim().notEmpty(),
    body("agreeTerms").equals("true"),
    body("promoCode").optional().trim(),
  ]),
  enrollmentController.create
);

router.get("/", auth, enrollmentController.list);
router.patch("/:id/status", auth, enrollmentController.updateStatus);
router.patch(
  "/:id/payment-status",
  auth,
  adminOnly,
  validate([
    param("id").isMongoId(),
    body("paymentStatus").isIn(["none", "paid", "half", "deposit_15"]),
  ]),
  enrollmentController.updatePaymentStatus
);

module.exports = router;
