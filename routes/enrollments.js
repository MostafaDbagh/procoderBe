const express = require("express");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const enrollmentController = require("../controllers/enrollmentController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.post(
  "/",
  validate([
    body("parentName").trim().notEmpty(),
    body("email").isEmail(),
    body("phone").trim().notEmpty(),
    body("relationship").trim().notEmpty(),
    body("childName").trim().notEmpty(),
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
