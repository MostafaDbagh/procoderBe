const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const validate = require("../middleware/validate");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const { signupCheckLimiter } = require("../middleware/antispam");

const router = express.Router();

// Strict rate limit for auth endpoints: 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
  skipSuccessfulRequests: true,
});

router.post(
  "/check-parent-signup",
  signupCheckLimiter,
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage("Valid email is required"),
    body("phone").optional({ checkFalsy: true }).trim().matches(/^\+?[\d\s()-]{8,20}$/).withMessage("Invalid phone number format"),
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
  authLimiter,
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/\d/)
      .withMessage("Password must contain at least one number"),
  ]),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  authController.login
);

router.post(
  "/admin-login",
  authLimiter,
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  authController.adminLogin
);

router.get("/me", auth, authController.getMe);

module.exports = router;
