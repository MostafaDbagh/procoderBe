const express = require("express");
const { body, param, query } = require("express-validator");
const validate = require("../middleware/validate");
const careerController = require("../controllers/careerController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

const DEPARTMENTS = ["engineering", "education", "design", "marketing", "operations", "support", "other"];
const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship", "freelance"];
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"];

// ── Admin routes (before public catch-all) ──
router.get(
  "/admin/list",
  auth,
  adminOnly,
  validate([
    query("active").optional().isIn(["true", "false"]),
    query("department").optional().isIn(DEPARTMENTS),
  ]),
  careerController.listAdmin
);

router.get(
  "/admin/:id",
  auth,
  adminOnly,
  validate([param("id").isMongoId()]),
  careerController.getByIdAdmin
);

router.post(
  "/",
  auth,
  adminOnly,
  validate([
    body("title.en").trim().notEmpty().withMessage("English title is required"),
    body("title.ar").trim().notEmpty().withMessage("Arabic title is required"),
    body("description.en").trim().notEmpty().withMessage("English description is required"),
    body("description.ar").trim().notEmpty().withMessage("Arabic description is required"),
    body("requirements.en").optional().trim(),
    body("requirements.ar").optional().trim(),
    body("department").optional().isIn(DEPARTMENTS),
    body("location").optional().trim().isLength({ max: 200 }),
    body("employmentType").optional().isIn(EMPLOYMENT_TYPES),
    body("experienceLevel").optional().isIn(EXPERIENCE_LEVELS),
    body("skills").optional().isArray({ max: 20 }),
    body("isActive").optional().isBoolean(),
    body("applicationEmail").optional().trim().isEmail(),
    body("applicationUrl").optional().trim(),
  ]),
  careerController.create
);

router.patch(
  "/:id",
  auth,
  adminOnly,
  validate([
    param("id").isMongoId(),
    body("title.en").optional().trim().notEmpty(),
    body("title.ar").optional().trim().notEmpty(),
    body("description.en").optional().trim().notEmpty(),
    body("description.ar").optional().trim().notEmpty(),
    body("requirements.en").optional().trim(),
    body("requirements.ar").optional().trim(),
    body("department").optional().isIn(DEPARTMENTS),
    body("location").optional().trim().isLength({ max: 200 }),
    body("employmentType").optional().isIn(EMPLOYMENT_TYPES),
    body("experienceLevel").optional().isIn(EXPERIENCE_LEVELS),
    body("skills").optional().isArray({ max: 20 }),
    body("isActive").optional().isBoolean(),
    body("applicationEmail").optional().trim().isEmail(),
    body("applicationUrl").optional().trim(),
  ]),
  careerController.update
);

router.delete(
  "/:id",
  auth,
  adminOnly,
  validate([param("id").isMongoId()]),
  careerController.remove
);

// ── Public routes ──
router.get("/", careerController.listActive);
router.get("/:slug", careerController.getBySlug);

module.exports = router;
