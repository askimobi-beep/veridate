const express = require("express");
const router = express.Router();
const { listJobTitles } = require("../controllers/jobTitle.Controller");

router.get("/", listJobTitles);

module.exports = router;
