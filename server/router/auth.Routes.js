const express = require("express");
const {
  Registeruser,
  // SetPassword,
  Loginuser,
  getMe,
  logoutUser,
  // googleLogin,
  // updateUser,
  // forgotPassword,
  // verifyOTP,
} = require("../controllers/auth.Controller");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register-user", Registeruser);
router.post("/login-user", Loginuser);
router.get("/me", protect, getMe); // 🛡️ Protected route
router.post("/logout-user", logoutUser);
// router.post("/set-password", SetPassword);
// router.post("/forgot-password", forgotPassword);
// router.post("/verify-otp", verifyOTP);
// router.put("/update-user", protect, updateUser);

// Assign-role

module.exports = router;
