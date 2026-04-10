const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.get("/overview", auth, adminOnly, adminController.overview);

module.exports = router;
