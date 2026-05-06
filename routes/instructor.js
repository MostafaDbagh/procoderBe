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
    body("addRecording.url").optional().isURL().withMessage("Valid URL required"),
    body("addRecording.title").optional().isString().trim(),
    body("addRecording.sessionDate").optional({ nullable: true }).trim(),
    body("removeRecordingId").optional().isString().trim(),
  ]),
  instructorController.updateStudent
);

// Homework routes
router.post(
  "/homework",
  validate([
    body("enrollmentId").trim().notEmpty().withMessage("enrollmentId is required"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").optional().trim(),
    body("dueDate").optional({ nullable: true }).trim(),
  ]),
  instructorController.createHomework
);
router.get("/homework", instructorController.listHomework);
router.patch(
  "/homework/:id",
  validate([
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim(),
    body("dueDate").optional({ nullable: true }).trim(),
    body("status").optional().isIn(["assigned", "submitted", "graded"]),
    body("grade").optional().trim(),
    body("feedback").optional().trim(),
  ]),
  instructorController.updateHomework
);
router.delete("/homework/:id", instructorController.deleteHomework);

module.exports = router;
