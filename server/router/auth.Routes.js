const express = require("express");
const {
  Registeruser,
  Loginuser,
  getMe,
  logoutUser,
  verifyOTP,
} = require("../controllers/auth.Controller");
// 👇 NEW: Import split controllers
const {
  googleLogin,
  facebookLogin,
  linkedinStart,
  linkedinCallback,
} = require("../controllers/oauth.controller");
const {
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
} = require("../controllers/password.controller");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// --- Local Auth ---
router.post("/register-user", Registeruser);
router.post("/verify-otp", verifyOTP);
router.post("/login-user", Loginuser);
router.get("/me", protect, getMe); // 🛡️ Protected route
router.post("/logout-user", logoutUser);

// --- OAuth ---
router.post("/google", googleLogin);
router.get("/linkedin", linkedinStart);
router.get("/linkedin/callback", linkedinCallback);
router.post("/facebook", facebookLogin);

// --- Password-Reset ---
router.post("/forgot-password", requestPasswordReset);
router.get("/reset-password/verify", verifyPasswordResetToken);
router.post("/reset-password", resetPassword);


module.exports = router;
