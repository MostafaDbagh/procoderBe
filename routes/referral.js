const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const referralController = require("../controllers/referralController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// Parent — get/create my referral code
router.get("/my", auth, referralController.getMyReferral);

// Public — validate a code
router.get("/validate/:code", referralController.validate);

// Admin
router.get("/admin/list", auth, adminOnly, referralController.listAdmin);
router.get("/admin/stats", auth, adminOnly, referralController.statsAdmin);
router.put(
  "/admin/:id",
  auth,
  adminOnly,
  validate([
    body("discountPercent").optional().isFloat({ min: 0, max: 100 }),
    body("isActive").optional().isBoolean(),
    body("maxUses").optional(),
  ]),
  referralController.updateAdmin
);

module.exports = router;
