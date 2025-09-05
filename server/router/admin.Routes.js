const express = require("express");
const { GetAllUsers, UpdateUser } = require("../controllers/admin.Controller");
const { isAdmin, protect } = require("../middlewares/authMiddleware");



const router = express.Router();

// ✅ protect must run before isAdmin
router.get("/get-allusers", protect, isAdmin, GetAllUsers);
router.put("/update-user/:id", protect, isAdmin, UpdateUser);



module.exports = router;
