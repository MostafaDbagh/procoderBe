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
    body("name").optional().trim().notEmpty(),
    body("phone").optional().trim().notEmpty(),
  ]),
  parentController.updateProfile
);

module.exports = router;
