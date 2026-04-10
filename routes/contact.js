const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const contactController = require("../controllers/contactController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("message").trim().notEmpty().withMessage("Message is required"),
  ]),
  contactController.submit
);

router.get("/", auth, contactController.list);

router.patch(
  "/:id",
  auth,
  validate([
    body("status")
      .isIn(["new", "read", "replied"])
      .withMessage("status must be new, read, or replied"),
  ]),
  contactController.updateStatus
);

module.exports = router;
