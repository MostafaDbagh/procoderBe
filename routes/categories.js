const express = require("express");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const categoryController = require("../controllers/categoryController");

const router = express.Router();
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

router.get("/admin/list", auth, adminOnly, categoryController.listAdmin);
router.get(
  "/admin/by-slug/:slug",
  auth,
  adminOnly,
  validate([param("slug").matches(slugRegex)]),
  categoryController.getBySlugAdmin
);

router.post(
  "/",
  auth,
  adminOnly,
  validate([
    body("slug").trim().matches(slugRegex).withMessage("Invalid slug format"),
    body("title.en").trim().notEmpty(),
    body("title.ar").trim().notEmpty(),
    body("sortOrder").optional().isInt(),
    body("isActive").optional().isBoolean(),
  ]),
  categoryController.create
);

router.put(
  "/:slug",
  auth,
  adminOnly,
  validate([
    param("slug").matches(slugRegex),
    body("title.en").optional().trim().notEmpty(),
    body("title.ar").optional().trim().notEmpty(),
    body("sortOrder").optional().isInt(),
    body("isActive").optional().isBoolean(),
  ]),
  categoryController.update
);

router.delete(
  "/:slug",
  auth,
  adminOnly,
  validate([param("slug").matches(slugRegex)]),
  categoryController.remove
);

router.get("/", categoryController.list);
router.get(
  "/:slug",
  validate([param("slug").matches(slugRegex)]),
  categoryController.getBySlug
);

module.exports = router;
