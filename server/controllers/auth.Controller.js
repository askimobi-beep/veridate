const User = require("../models/auth.model");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const {
  sendForgotPasswordEmail,
} = require("../utils/emailService");


exports.Registeruser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check required fields
    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required: firstName, lastName, email, password" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Optionally: send a welcome email (commented out)
    // await sendRegistrationEmail(email, firstName);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
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

exports.SetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validate inputs
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password already set
    if (user.password) {
      return res.status(400).json({
        message: "Password already set. Please log in instead.",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include an uppercase letter and a special character",
      });
    }

    // Hash and save password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Password set successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Set password error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    await sendForgotPasswordEmail(email, otp);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const user = await User.findOne({ email });

    if (!user || user.resetOTP !== parseInt(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.resetOTPExpiry) {
      return res.status(410).json({ message: "OTP has expired" });
    }

    // ✅ OTP is valid — clear it
    user.resetOTP = null;
    user.resetOTPExpiry = null;

    // ✅ Optional: Reset password if provided
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      user.password = hashed;
    }

    await user.save({ validateBeforeSave: false }); // Don't revalidate contact etc.

    res.status(200).json({
      message: newPassword
        ? "Password reset successful 🎉"
        : "OTP verified. You may now reset your password.",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
