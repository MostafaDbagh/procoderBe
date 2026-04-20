const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const teamController = require("../controllers/teamController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  teamPhotoUploadMiddleware,
} = require("../middleware/teamPhotoUpload");

const router = express.Router();

router.get("/admin/list", auth, adminOnly, teamController.listAdmin);

router.post(
  "/upload",
  auth,
  adminOnly,
  (req, res, next) => {
    teamPhotoUploadMiddleware(req, res, (err) => {
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
  teamController.uploadPhoto
);

// Public
router.get("/", teamController.list);
router.get("/:id", teamController.getById);

// Admin only
router.post(
  "/",
  auth,
  adminOnly,
  validate([
    body("name.en").trim().notEmpty().withMessage("English name is required"),
    body("name.ar").trim().notEmpty().withMessage("Arabic name is required"),
    body("role.en").trim().notEmpty().withMessage("English role is required"),
    body("role.ar").trim().notEmpty().withMessage("Arabic role is required"),
    body("avatar")
      .trim()
      .notEmpty()
      .isLength({ max: 2 })
      .withMessage("Avatar must be 1-2 characters"),
  ]),
  teamController.create
);

router.put("/:id", auth, adminOnly, teamController.update);
router.delete("/:id/permanent", auth, adminOnly, teamController.permanentDelete);
router.delete("/:id", auth, adminOnly, teamController.remove);

module.exports = router;
