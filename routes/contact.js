const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const contactController = require("../controllers/contactController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { honeypot, timingGate, contactLimiter } = require("../middleware/antispam");

const router = express.Router();

router.post(
  "/",
  contactLimiter,
  honeypot,
  timingGate(3000),
  validate([
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name too long"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("subject").trim().notEmpty().withMessage("Subject is required").isLength({ max: 200 }).withMessage("Subject too long"),
    body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 5000 }).withMessage("Message too long (max 5000 characters)"),
  ]),
  contactController.submit
);

router.get("/", auth, adminOnly, contactController.list);

router.patch(
  "/:id",
  auth,
  adminOnly,
  validate([
    body("status")
      .isIn(["new", "read", "replied"])
      .withMessage("status must be new, read, or replied"),
  ]),
  contactController.updateStatus
);

router.delete("/:id", auth, adminOnly, contactController.remove);

module.exports = router;
