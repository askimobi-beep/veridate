const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // verification credits (your existing feature)
    verifyCredits: {
      education: { type: Number, default: 1 },
      experience: { type: Number, default: 1 },
    },

    // OTP email flow
    otp: { type: Number },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },

    // 🔽 Google fields
    googleId: { type: String, index: true },
    facebookId: { type: String, index: true },
    picture: { type: String },
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    // Block User
    isBlocked: { type: Boolean, default: false },
  },

  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
