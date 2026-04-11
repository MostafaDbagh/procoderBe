const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post(
  "/check-parent-signup",
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body().custom((_, { req }) => {
      const email = String(req.body.email || "").trim();
      const phoneDigits = String(req.body.phone || "").replace(/\D/g, "");
      if (!email && phoneDigits.length < 8) {
        throw new Error("Valid email or phone (8+ digits) required");
      }
      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        throw new Error("Valid email is required");
      }
      return true;
    }),
  ]),
  authController.checkParentSignupEligibility
);

router.post(
  "/register",
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ]),
  authController.register
);

router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  authController.login
);

router.post(
  "/admin-login",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  authController.adminLogin
);

router.get("/me", auth, authController.getMe);

module.exports = router;
