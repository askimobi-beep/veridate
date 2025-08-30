// routes/profile.routes.js (or a new verify.routes.js)
const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  verifyEducation,
  verifyExperience,
} = require("../controllers/verify.controller");

const router = express.Router();

// verify education row
// POST /profiles/:targetUserId/verify/education/:eduId
router.post("/profiles/:targetUserId/verify/education/:eduId", protect, verifyEducation);

// verify experience row
// POST /profiles/:targetUserId/verify/experience/:expId
router.post("/profiles/:targetUserId/verify/experience/:expId", protect, verifyExperience);

module.exports = router;
