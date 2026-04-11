const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const courseController = require("../controllers/courseController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  courseImageUploadMiddleware,
} = require("../middleware/courseImageUpload");
const Category = require("../models/Category");

const router = express.Router();

async function categoryMustBeActive(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase();
  const c = await Category.findOne({ slug, isActive: true }).lean();
  if (!c) {
    throw new Error("Unknown or inactive category");
  }
  return true;
}

router.get("/admin/list", auth, courseController.listAdmin);
router.get("/admin/by-slug/:slug", auth, courseController.getBySlugAdmin);

router.post(
  "/upload",
  auth,
  adminOnly,
  (req, res, next) => {
    courseImageUploadMiddleware(req, res, (err) => {
      if (err) {
        const msg =
          err.code === "LIMIT_FILE_SIZE"
            ? "File too large (max 2MB)"
            : err.message || "Upload failed";
        return res.status(400).json({ message: msg });
      }
      next();
    });
  },
  courseController.uploadCourseImage
);

router.get("/", courseController.list);
router.get("/:slug", courseController.getBySlug);

router.post(
  "/",
  auth,
  validate([
    body("slug").trim().notEmpty(),
    body("category")
      .trim()
      .notEmpty()
      .customSanitizer((v) => String(v).trim().toLowerCase())
      .custom(categoryMustBeActive),
    body("ageMin").isInt({ min: 6, max: 18 }),
    body("ageMax").isInt({ min: 6, max: 18 }),
    body("level").isIn(["beginner", "intermediate", "advanced"]),
    body("lessons").isInt({ min: 1 }),
    body("durationWeeks").isInt({ min: 1 }),
    body("title.en").trim().notEmpty(),
    body("title.ar").trim().notEmpty(),
    body("description.en").trim().notEmpty(),
    body("description.ar").trim().notEmpty(),
    body("price").optional().isFloat({ min: 0 }),
    body("discountPercent")
      .optional()
      .isFloat({ min: 0, max: 100 }),
    body("currency")
      .optional()
      .trim()
      .customSanitizer((v) => (v ? String(v).toUpperCase() : v))
      .custom((v) => !v || v === "USD")
      .withMessage("Only USD is supported"),
  ]),
  courseController.create
);

router.put(
  "/:slug",
  auth,
  validate([
    body("category")
      .optional()
      .trim()
      .notEmpty()
      .customSanitizer((v) => String(v).trim().toLowerCase())
      .custom(categoryMustBeActive),
    body("ageMin").optional().isInt({ min: 6, max: 18 }),
    body("ageMax").optional().isInt({ min: 6, max: 18 }),
    body("level").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("lessons").optional().isInt({ min: 1 }),
    body("durationWeeks").optional().isInt({ min: 1 }),
    body("price").optional().isFloat({ min: 0 }),
    body("discountPercent")
      .optional()
      .isFloat({ min: 0, max: 100 }),
    body("currency")
      .optional()
      .trim()
      .customSanitizer((v) => (v ? String(v).toUpperCase() : v))
      .custom((v) => !v || v === "USD")
      .withMessage("Only USD is supported"),
  ]),
  courseController.update
);
router.delete("/:slug", auth, courseController.remove);

module.exports = router;
