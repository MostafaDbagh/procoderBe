const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const challengeController = require("../controllers/challengeController");

const router = express.Router();

router.get("/public/latest", challengeController.listPublicLatest);

router.get("/", auth, adminOnly, challengeController.list);
router.get("/:id", auth, adminOnly, challengeController.getById);
router.post(
  "/",
  auth,
  adminOnly,
  validate([
    body("slug").trim().notEmpty(),
    body("monthKey").trim().notEmpty(),
    body("titleEn").trim().notEmpty(),
    body("titleAr").trim().notEmpty(),
  ]),
  challengeController.create
);
router.put("/:id", auth, adminOnly, challengeController.update);
router.delete("/:id", auth, adminOnly, challengeController.remove);

module.exports = router;
