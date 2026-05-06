const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const parentController = require("../controllers/parentController");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get("/dashboard", parentController.dashboard);

router.put(
  "/children",
  validate([body("children").isArray().withMessage("children must be an array")]),
  parentController.updateChildren
);

router.put(
  "/profile",
  validate([
    body("name").optional().trim().notEmpty().isLength({ max: 100 }).withMessage("Name too long"),
    body("phone").optional().trim().notEmpty().matches(/^\+?[\d\s()-]{8,20}$/).withMessage("Invalid phone number format"),
  ]),
  parentController.updateProfile
);

router.get("/homework", parentController.getHomework);

module.exports = router;
