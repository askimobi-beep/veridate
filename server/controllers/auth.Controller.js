const User = require("../models/auth.model");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../utils/emailService");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const nodeCrypto = require("node:crypto");
const crypto = require("crypto");
const qs = require("querystring");
const COOKIE_NAME = "li_oauth_state";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI,
  CLIENT_APP_URL,
} = process.env;

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
        isBlocked: false,
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

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🚫 block gate
    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account is blocked. Contact support." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const payload = { id: user._id, email: user.email, role: user.role };
    const token = generateToken(payload, res);

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
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = (payload.email || "").toLowerCase();
    const emailVerified = payload.email_verified;
    const picture = payload.picture;
    const givenName = payload.given_name || "";
    const familyName = payload.family_name || "";

    if (!email || !emailVerified) {
      return res.status(403).json({ message: "Google email not verified" });
    }

    let user = await User.findOne({ email });

    if (user) {
      // 🚫 block gate
      if (user.isBlocked) {
        return res
          .status(403)
          .json({ message: "Your account is blocked. Contact support." });
      }

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
      // brand new Google user (implicitly not blocked because schema default = false)
      user = await User.create({
        firstName: givenName || "User",
        lastName: familyName || "",
        email,
        password: undefined,
        role: "user",
        isVerified: true,
        googleId,
        picture: picture || undefined,
        provider: "google",
      });
    }

    const token = generateToken(
      { id: user._id, email: user.email, role: user.role },
      res
    );

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

exports.linkedinStart = async (req, res) => {
  try {
    const state = crypto.randomBytes(24).toString("hex");
    // store state in short-lived, httpOnly cookie to prevent CSRF
    res.cookie(COOKIE_NAME, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true in prod over https
      maxAge: 1000 * 60 * 10, // 10 minutes
      path: "/",
    });

    // optional: remember where to send them after login
    const from =
      typeof req.query.from === "string" && req.query.from.length < 512
        ? req.query.from
        : "";

    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", LINKEDIN_REDIRECT_URI);
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("state", `${state}::${encodeURIComponent(from)}`);

    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error("LinkedIn start error:", err);
    return res.redirect(`${CLIENT_APP_URL}/login?error=linkedin_start_failed`);
  }
};



exports.linkedinCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(
        `${CLIENT_APP_URL}/login?error=missing_code_or_state`
      );
    }

    // validate state
    const cookieState = req.cookies[COOKIE_NAME];
    if (!cookieState) {
      return res.redirect(`${CLIENT_APP_URL}/login?error=state_cookie_missing`);
    }

    const [stateValue, fromEncoded = ""] = String(state).split("::");
    if (cookieState !== stateValue) {
      return res.redirect(`${CLIENT_APP_URL}/login?error=state_mismatch`);
    }
    // clear state cookie
    res.clearCookie(COOKIE_NAME, { path: "/" });

    // 2a) exchange code for access token (+ id_token due to OIDC)
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token /*, expires_in, id_token */ } = tokenRes.data || {};
    if (!access_token) {
      return res.redirect(
        `${CLIENT_APP_URL}/login?error=linkedin_token_missing`
      );
    }

    // 2b) fetch user profile via OIDC userinfo (simple + stable)
    const meRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // expected fields (email may be absent)
    const {
      sub: linkedinId,
      email,
      email_verified: emailVerified,
      given_name: givenName,
      family_name: familyName,
      picture,
      name,
    } = meRes.data || {};

    // hard requirements: we need a stable id; prefer email for your DB if required
    if (!linkedinId) {
      return res.redirect(
        `${CLIENT_APP_URL}/login?error=linkedin_profile_missing`
      );
    }

    // if your User schema requires unique email, you can reject when missing:
    if (!email) {
      // You could instead ask user to add an email flow here if you want to support email-less accounts.
      return res.redirect(`${CLIENT_APP_URL}/login?error=linkedin_no_email`);
    }

    const normalizedEmail = String(email).toLowerCase();

    // 2c) find or create
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // blocked gate
      if (user.isBlocked) {
        return res.redirect(`${CLIENT_APP_URL}/login?error=account_blocked`);
      }

      const updates = {};
      if (!user.linkedinId) updates.linkedinId = linkedinId;
      if (picture && !user.picture) updates.picture = picture;
      if (!user.firstName && (givenName || name))
        updates.firstName = givenName || name?.split(" ")[0] || "User";
      if (!user.lastName && familyName) updates.lastName = familyName;
      if (!user.isVerified) {
        updates.isVerified = !!emailVerified;
        updates.otp = null;
        updates.otpExpiry = null;
      }
      if (!user.provider) updates.provider = "linkedin";

      if (Object.keys(updates).length) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
    } else {
      // new user via LinkedIn
      user = await User.create({
        firstName: givenName || (name ? name.split(" ")[0] : "User"),
        lastName: familyName || "",
        email: normalizedEmail,
        password: undefined,
        role: "user",
        isVerified: !!emailVerified, // trust OIDC email_verified when provided
        linkedinId,
        picture: picture || undefined,
        provider: "linkedin",
      });
    }

    // 2d) issue your JWT (httpOnly cookie or return in body — match your Google flow)
    generateToken({ id: user._id, email: user.email, role: user.role }, res);

    // 2e) bounce back to app; front-end will call /auth/me and route
    const from = decodeURIComponent(fromEncoded || "");
    const next = from || "/dashboard";
    return res.redirect(
      `${CLIENT_APP_URL}/oauth/callback?provider=linkedin&ok=1&next=${encodeURIComponent(
        next
      )}`
    );
  } catch (err) {
    console.error(
      "LinkedIn callback error:",
      err?.response?.data || err.message || err
    );
    return res.redirect(
      `${CLIENT_APP_URL}/login?error=linkedin_callback_failed`
    );
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

// exports.getMe = async (req, res) => {
//   try {
//     // req.user is set by the `protect` middleware after verifying JWT
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const user = await User.findById(userId).select("-password"); // exclude password

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ user });
//   } catch (error) {
//     console.error("GetMe error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id; // set by protect middleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // fetch user (excluding password)
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // fetch profile but only profilePic
    const profile = await Profile.findOne({ user: userId }).select(
      "profilePic"
    );

    // attach profilePic if exists
    const responseUser = {
      ...user.toObject(),
      profilePic: profile?.profilePic || null,
    };

    res.status(200).json({ user: responseUser });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
