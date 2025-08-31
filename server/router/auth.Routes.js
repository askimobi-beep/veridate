const express = require("express");
const {
  Registeruser,
  Loginuser,
  getMe,
  logoutUser,
  verifyOTP,
} = require("../controllers/auth.Controller");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register-user", Registeruser);
router.post("/verify-otp", verifyOTP);
router.post("/login-user", Loginuser);
router.get("/me", protect, getMe); // 🛡️ Protected route
router.post("/logout-user", logoutUser);



module.exports = router;
