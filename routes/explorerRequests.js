const express = require("express");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const controller = require("../controllers/explorerRequestController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  honeypot,
  timingGate,
  explorerRequestLimiter,
} = require("../middleware/antispam");

const router = express.Router();

router.post(
  "/",
  explorerRequestLimiter,
  honeypot,
  timingGate(3000),
  validate([
    body("type")
      .isIn(["registration", "call_request"])
      .withMessage("type must be registration or call_request"),
    body("parentName")
      .trim()
      .notEmpty()
      .withMessage("Parent name is required")
      .isLength({ max: 100 })
      .withMessage("Parent name too long"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").optional().trim().isLength({ max: 30 }),
    body("childName").optional().trim().isLength({ max: 100 }),
    body("childAge").optional().trim().isLength({ max: 10 }),
    body("childLanguage").optional().isIn(["ar", "en", "both", ""]),
    body("preferredMethod").optional().isIn(["whatsapp", "call", "email", ""]),
    body("preferredTime").optional().isIn(["morning", "afternoon", "evening", ""]),
    body("note").optional().trim().isLength({ max: 2000 }).withMessage("Note too long"),
    body("fitOutcome")
      .optional()
      .isIn([
        "EXPLORER_LIKELY_FIT",
        "EXPLORER_WITH_REVIEW",
        "CHECK_HIGHER_STAGE",
        "PRE_START_REVIEW",
        "",
      ]),
    body("answers").optional().isArray({ max: 12 }).withMessage("Too many answers"),
    body("answers.*.id").optional().isString().isLength({ max: 64 }),
    body("answers.*.question").optional().isString().isLength({ max: 300 }),
    body("answers.*.value").optional().isString().isLength({ max: 120 }),
    body("answers.*.label").optional().isString().isLength({ max: 300 }),
    // Registration requests must carry explicit consent
    body("consent")
      .if(body("type").equals("registration"))
      .equals("true")
      .withMessage("Consent is required"),
  ]),
  controller.create
);

router.get("/", auth, adminOnly, controller.list);

router.patch(
  "/:id",
  auth,
  adminOnly,
  validate([
    param("id").isMongoId(),
    body("status")
      .isIn(["new", "contacted", "closed"])
      .withMessage("status must be new, contacted, or closed"),
  ]),
  controller.updateStatus
);

router.delete("/:id", auth, adminOnly, controller.remove);

module.exports = router;
