const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pricingController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Public
router.get("/", ctrl.getPublic);

// Admin — plans
router.get("/admin/plans", auth, adminOnly, ctrl.listPlans);
router.put("/admin/plans", auth, adminOnly, ctrl.upsertPlan);
router.delete("/admin/plans/:id", auth, adminOnly, ctrl.deletePlan);

// Admin — discounts
router.get("/admin/discounts", auth, adminOnly, ctrl.listDiscounts);
router.put("/admin/discounts", auth, adminOnly, ctrl.upsertDiscount);
router.delete("/admin/discounts/:id", auth, adminOnly, ctrl.deleteDiscount);

// Admin — FAQs
router.get("/admin/faqs", auth, adminOnly, ctrl.listFaqs);
router.put("/admin/faqs", auth, adminOnly, ctrl.upsertFaq);
router.delete("/admin/faqs/:id", auth, adminOnly, ctrl.deleteFaq);

module.exports = router;
