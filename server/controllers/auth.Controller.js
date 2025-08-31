const User = require("../models/auth.model");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../utils/emailService");

exports.Registeruser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ message: "User already exists" });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    // if user exists but not verified → overwrite OTP
    if (existingUser && !existingUser.isVerified) {
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      existingUser.password = await bcrypt.hash(password, 10);
      await existingUser.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false,
      });
      await newUser.save();
    }

    await sendOTPEmail(email, otp);

    res
      .status(200)
      .json({ message: "A verification code has been sent to your email address. Please check your inbox (and Spam/Junk folder if you don’t see it)."});
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.Loginuser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Create JWT payload
    const payload = {
      id: user._id,
      email: user.email,
    };

    const token = generateToken(payload, res); // ✅ FIXED

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  const { cnic, address, contact } = req.body;

  try {
    const userId = req.user.id;

    // Check if CNIC is already used by another user
    if (cnic) {
      const existingCnicUser = await User.findOne({
        cnic,
        _id: { $ne: userId },
      });
      if (existingCnicUser) {
        return res
          .status(409)
          .json({ message: "CNIC is already registered with another account" });
      }
    }

    // Check if contact is already used by another user
    if (contact) {
      const existingContactUser = await User.findOne({
        contact,
        _id: { $ne: userId },
      });
      if (existingContactUser) {
        return res.status(409).json({
          message: "Contact number is already registered with another account",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { cnic, address, contact },
      { new: true }
    );

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("Update error", err);
    res.status(500).json({ message: "Update failed" });
  }
};

exports.logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), // Set to epoch time
    sameSite: "Strict", // Optional: helps with CSRF
    secure: process.env.NODE_ENV === "production", // serve over HTTPS in prod
  });

  res.status(200).json({ message: "Logged out successfully" });
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (user.otp !== parseInt(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(410).json({ message: "OTP expired" });
    }

    // ✅ Verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully ✅" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user is set by the `protect` middleware after verifying JWT
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
