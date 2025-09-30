// models/User.js
const mongoose = require("mongoose");

const EduCreditSchema = new mongoose.Schema(
  {
    institute: { type: String, required: true },
    instituteKey: { type: String, required: true, index: true }, // normalized lowercase
    available: { type: Number, default: 1 },
    used: { type: Number, default: 0 },
    total: { type: Number, default: 1 }, // 👈 lifetime earned for this institute
  },
  { _id: false }
);

const ExpCreditSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    companyKey: { type: String, required: true, index: true }, // normalized
    available: { type: Number, default: 1, min: 0 },
    used: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

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
    passwordChangedAt: { type: Date },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    // 🔥 credits per institute
    verifyCredits: {
      education: { type: [EduCreditSchema], default: [] },
      experience: { type: [ExpCreditSchema], default: [] },
    },

    // OTP flow
    otp: { type: Number },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },

    // OAuth
    googleId: { type: String, index: true },
    facebookId: { type: String, index: true },
    linkedinId: { type: String, index: true },
    picture: { type: String },
    provider: {
      type: String,
      enum: ["local", "google", "facebook" , "linkedin"],
      default: "local",
    },

    // Moderation
    isBlocked: { type: Boolean, default: false },

    resetPasswordToken: { type: String, index: true },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
