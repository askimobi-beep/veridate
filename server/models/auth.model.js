const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      match: [
        /^(?=.*[A-Z])(?=.*[!@#$%^&*])/,
        "Password must be at least 8 characters long, include an uppercase letter and a special character",
      ],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    verifyCredits: {
      education: { type: Number, default: 1 }, // user can verify 1 education
      experience: { type: Number, default: 1 }, // and 1 experience
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
