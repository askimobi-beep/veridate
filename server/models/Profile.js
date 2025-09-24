// models/Profile.js
const mongoose = require("mongoose");

const EducationSchema = new mongoose.Schema({
  degreeTitle: String,
  startDate: Date,
  endDate: Date,
  institute: String,
  instituteWebsite: String,
  degreeFile: String,
  hiddenFields: [String],

  verifyCount: { type: Number, default: 0 },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // helps matching with User.verifyCredits buckets
  instituteKey: { type: String, index: true },
});



const ExperienceSchema = new mongoose.Schema({
  jobTitle: String,
  startDate: Date,
  endDate: Date,
  company: String,
  companyWebsite: String,
  experienceLetterFile: String,
  jobFunctions: [String],
  industry: String,
  hiddenFields: [String],

  verifyCount: { type: Number, default: 0 },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // normalized key to align with User.verifyCredits.experience buckets
  companyKey: { type: String, index: true },
});

const ProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // --- personal ---
    name: String,
    email: String,
    fatherName: String,
    mobileCountryCode: String, // 👈 add
    mobile: String,
    cnic: String,
    city: String,
    country: String,
    gender: String,
    maritalStatus: String,
    residentStatus: String,
    nationality: String,
    dob: Date,
    resume: String,
    profilePic: String,
    shiftPreferences: [String],
    workAuthorization: [String],
    personalInfoLocked: { type: Boolean, default: false },
    personalHiddenFields: { type: [String], default: [] },

    // --- education ---
    educationLocked: { type: Boolean, default: false },
    education: { type: [EducationSchema], default: [] },

    // --- experience ---
    experienceLocked: { type: Boolean, default: false },
    experience: { type: [ExperienceSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);
