const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const blogController = require("../controllers/blogController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// Admin routes FIRST (before /:slug catch-all)
router.get("/admin/list", auth, adminOnly, blogController.listAdmin);
router.get("/admin/:slug", auth, adminOnly, blogController.getBySlugAdmin);

router.post(
  "/",
  auth,
  adminOnly,
  validate([
    body("slug").trim().notEmpty(),
    body("title.en").trim().notEmpty(),
    body("title.ar").trim().notEmpty(),
    body("excerpt.en").trim().notEmpty(),
    body("excerpt.ar").trim().notEmpty(),
    body("body.en").trim().notEmpty(),
    body("body.ar").trim().notEmpty(),
    body("category").optional().isIn(["coding", "robotics", "arabic", "parenting", "stem", "general"]),
    body("author.name").trim().notEmpty(),
  ]),
  blogController.create
);

router.put("/:slug", auth, adminOnly, blogController.update);
router.delete("/:slug", auth, adminOnly, blogController.remove);

// Public routes AFTER
router.get("/", blogController.listPublished);
router.get("/:slug", blogController.getBySlug);

module.exports = router;
