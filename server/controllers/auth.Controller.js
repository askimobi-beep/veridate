const User = require("../models/auth.model");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../utils/emailService");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const nodeCrypto = require("node:crypto");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    res.status(200).json({
      message:
        "A verification code has been sent to your email address. Please check your inbox (and Spam/Junk folder if you don’t see it).",
    });
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
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // Google ID token
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    // Verify the ID token against Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, // must match your Web Client ID
    });
    const payload = ticket.getPayload();

    // Extract fields
    const googleId = payload.sub;
    const email = (payload.email || "").toLowerCase();
    const emailVerified = payload.email_verified;
    const picture = payload.picture;
    const givenName = payload.given_name || "";
    const familyName = payload.family_name || "";

    if (!email || !emailVerified) {
      return res.status(403).json({ message: "Google email not verified" });
    }

    // 🔍 check for existing user
    let user = await User.findOne({ email });

    if (user) {
      const updates = {};

      if (!user.googleId) updates.googleId = googleId;
      if (picture && !user.picture) updates.picture = picture;

      if (!user.isVerified) {
        updates.isVerified = true;
        updates.otp = null;
        updates.otpExpiry = null;
      }

      if (!user.firstName && givenName) updates.firstName = givenName;
      if (!user.lastName && familyName) updates.lastName = familyName;

      if (Object.keys(updates).length) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
    } else {
      // 🆕 create new google user
      user = await User.create({
        firstName: givenName || "User",
        lastName: familyName || "",
        email,
        password: undefined, // Google users don’t need password
        role: "user",
        verifyCredits: { education: 1, experience: 1 },
        isVerified: true,
        googleId,
        picture: picture || undefined,
        provider: "google",
      });
    }

    // 🔑 generate JWT + cookie
    const token = generateToken({ id: user._id, email: user.email }, res);

    return res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        picture: user.picture,
        role: user.role,
        createdAt: user.createdAt,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error("Google Login error:", err.message || err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.facebookLogin = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;
    if (!accessToken || !userID) {
      return res.status(400).json({ message: "Missing Facebook credentials" });
    }

    const appId = process.env.FB_APP_ID;
    const appSecret = process.env.FB_APP_SECRET;
    if (!appId || !appSecret) {
      console.error("FB_APP_ID or FB_APP_SECRET missing");
      return res.status(500).json({ message: "Server misconfigured" });
    }

    // 1) Verify token belongs to YOUR app + is valid
    const appAccessToken = `${appId}|${appSecret}`;
    const debugURL = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`;
    const debug = await axios.get(debugURL);
    const dt = debug?.data?.data;

    if (!dt?.is_valid || dt?.app_id !== appId || dt?.user_id !== userID) {
      return res.status(401).json({ message: "Invalid Facebook token" });
    }

    // 2) Fetch profile (with appsecret_proof for security)
    const appsecret_proof = nodeCrypto
      .createHmac("sha256", appSecret)
      .update(accessToken)
      .digest("hex");

    const fields = "id,email,first_name,last_name,picture.type(large)";
    const meURL = `https://graph.facebook.com/v19.0/me?fields=${fields}&access_token=${accessToken}&appsecret_proof=${appsecret_proof}`;
    const me = await axios.get(meURL);
    const profile = me.data;

    const facebookId = profile.id;
    const email = (profile.email || "").toLowerCase();
    const firstName = profile.first_name || "User";
    const lastName = profile.last_name || "";
    const picture = profile?.picture?.data?.url;

    // we require email for account linking/creation
    if (!email) {
      return res.status(403).json({
        message:
          "Facebook login requires email permission. Please allow email.",
      });
    }

    // 3) Link or create
    let user = await User.findOne({ email });

    if (user) {
      const updates = {};
      if (!user.facebookId) updates.facebookId = facebookId;
      if (picture && !user.picture) updates.picture = picture;

      if (!user.isVerified) {
        updates.isVerified = true;
        updates.otp = null;
        updates.otpExpiry = null;
      }
      if (!user.firstName && firstName) updates.firstName = firstName;
      if (!user.lastName && lastName) updates.lastName = lastName;
      if (user.provider === "local") updates.provider = "facebook"; // optional

      if (Object.keys(updates).length) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
    } else {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: undefined,
        role: "user",
        verifyCredits: { education: 1, experience: 1 },
        isVerified: true,
        facebookId,
        picture: picture || undefined,
        provider: "facebook",
      });
    }

    // 4) Issue your own session cookie (same as your googleLogin)
    const token = generateToken({ id: user._id, email: user.email }, res);

    return res.status(200).json({
      message: "Facebook login successful",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        picture: user.picture,
        role: user.role,
        createdAt: user.createdAt,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error(
      "Facebook login error:",
      err.response?.data || err.message || err
    );
    return res.status(500).json({ message: "Internal Server Error" });
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
