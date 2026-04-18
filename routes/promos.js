const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const promoQuoteController = require("../controllers/promoQuoteController");
const { promoQuoteLimiter } = require("../middleware/antispam");

const router = express.Router();

router.post(
  "/quote",
  promoQuoteLimiter,
  validate([
    body("courseId").trim().notEmpty(),
    body("promoCode").optional().trim(),
    body("parentEmail").optional().trim().isEmail(),
  ]),
  promoQuoteController.quote
);

module.exports = router;
