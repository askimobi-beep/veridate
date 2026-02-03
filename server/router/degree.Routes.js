const express = require("express");
const router = express.Router();
const { listDegrees } = require("../controllers/degree.Controller");

router.get("/", listDegrees);

module.exports = router;
