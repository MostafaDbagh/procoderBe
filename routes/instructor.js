const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const instructorController = require("../controllers/instructorController");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/dashboard", instructorController.dashboard);

router.post(
  "/notes",
  validate([
    body("enrollmentId").trim().notEmpty().withMessage("enrollmentId is required"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("body").trim().notEmpty().withMessage("Body is required"),
    body("type").optional().isIn(["progress", "feedback", "absence", "achievement", "general"]),
  ]),
  instructorController.createNote
);

router.get("/notes", instructorController.listNotes);
router.delete("/notes/:id", instructorController.deleteNote);

router.patch(
  "/students/:enrollmentId",
  validate([
    body("lessonsDone").optional().isInt({ min: 0 }).toInt(),
    body("nextSession").optional({ nullable: true }).trim(),
    body("addBadge").optional().isString().trim(),
    body("removeBadge").optional().isString().trim(),
  ]),
  instructorController.updateStudent
);

module.exports = router;
