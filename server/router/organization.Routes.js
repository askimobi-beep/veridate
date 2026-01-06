const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  listOrganizations,
  getOrganizationDashboard,
} = require("../controllers/organization.Controller");

const router = express.Router();

router.get("/", protect, listOrganizations);
router.get("/dashboard", protect, getOrganizationDashboard);

module.exports = router;
