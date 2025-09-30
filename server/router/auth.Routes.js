const express = require("express");
const {
  Registeruser,
  Loginuser,
  getMe,
  logoutUser,
  verifyOTP,
  googleLogin,
  facebookLogin,
  linkedinStart,
  linkedinCallback,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
} = require("../controllers/auth.Controller");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register-user", Registeruser);
router.post("/verify-otp", verifyOTP);
router.post("/login-user", Loginuser);
router.post("/google", googleLogin);
router.get("/linkedin", linkedinStart); 
router.get("/linkedin/callback", linkedinCallback); 
router.post("/facebook", facebookLogin);
router.get("/me", protect, getMe); // 🛡️ Protected route
router.post("/logout-user", logoutUser);

// Password-Reset
router.post("/forgot-password", requestPasswordReset);
router.get("/reset-password/verify", verifyPasswordResetToken);
router.post("/reset-password", resetPassword);


module.exports = router;
