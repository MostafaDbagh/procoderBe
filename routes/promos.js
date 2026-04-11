const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const promoQuoteController = require("../controllers/promoQuoteController");

const router = express.Router();

router.post(
  "/quote",
  validate([
    body("courseId").trim().notEmpty(),
    body("promoCode").optional().trim(),
  ]),
  promoQuoteController.quote
);

module.exports = router;
