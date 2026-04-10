const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const courseController = require("../controllers/courseController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/admin/list", auth, courseController.listAdmin);
router.get("/admin/by-slug/:slug", auth, courseController.getBySlugAdmin);
router.get("/", courseController.list);
router.get("/:slug", courseController.getBySlug);

router.post(
  "/",
  auth,
  validate([
    body("slug").trim().notEmpty(),
    body("category").isIn(["programming", "robotics", "algorithms", "arabic", "quran"]),
    body("ageMin").isInt({ min: 6, max: 18 }),
    body("ageMax").isInt({ min: 6, max: 18 }),
    body("level").isIn(["beginner", "intermediate", "advanced"]),
    body("lessons").isInt({ min: 1 }),
    body("durationWeeks").isInt({ min: 1 }),
    body("title.en").trim().notEmpty(),
    body("title.ar").trim().notEmpty(),
    body("description.en").trim().notEmpty(),
    body("description.ar").trim().notEmpty(),
  ]),
  courseController.create
);

router.put("/:slug", auth, courseController.update);
router.delete("/:slug", auth, courseController.remove);

module.exports = router;
