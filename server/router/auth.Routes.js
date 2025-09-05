const express = require("express");
const {
  Registeruser,
  Loginuser,
  getMe,
  logoutUser,
  verifyOTP,
  googleLogin,
  facebookLogin,
} = require("../controllers/auth.Controller");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register-user", Registeruser);
router.post("/verify-otp", verifyOTP);
router.post("/login-user", Loginuser);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.get("/me", protect, getMe); // 🛡️ Protected route
router.post("/logout-user", logoutUser);

module.exports = router;
