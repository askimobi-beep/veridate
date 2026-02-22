const express = require("express");
const { softAuth } = require("../middlewares/softAuth");
const { searchAllJobs } = require("../controllers/company.Controller");

const router = express.Router();

// Public job search (softAuth so logged-in users get context, but anyone can browse)
router.get("/", softAuth, searchAllJobs);

module.exports = router;
