const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

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
