const User = require("../models/auth.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/emailService");

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: String(email).toLowerCase() });

    // Always respond 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: "If the account exists, a reset link has been sent." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked. Contact support." });
    }

    // Create raw and hashed tokens
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    const { CLIENT_APP_URL } = process.env;
    const resetUrl = `${CLIENT_APP_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return res.status(200).json({ message: "If the account exists, a reset link has been sent." });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyPasswordResetToken = async (req, res) => {
  try {
    const { token, email } = req.query || {};
    if (!token || !email) return res.status(400).json({ message: "Missing token or email" });

    const hashed = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({
      email: String(email).toLowerCase(),
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).lean();

    return res.status(200).json({ valid: !!user });
  } catch (err) {
    console.error("verifyPasswordResetToken error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body || {};
    if (!token || !email || !password) {
      return res.status(400).json({ message: "token, email, and password are required" });
    }

    const hashed = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({
      email: String(email).toLowerCase(),
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // If you rely on email verification—but they’ve now proven email ownership—optionally mark verified:
    if (!user.isVerified) {
      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
    }

    await user.save();

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
