// models/Profile.js
const mongoose = require("mongoose");

const VerificationReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    projectTitle: { type: String, default: "" },
    projectDescription: { type: String, default: "" },
  },
  { _id: false }
);

const ProfileProjectSchema = new mongoose.Schema({
  projectTitle: String,
  company: String,
  projectUrl: String,
  startDate: Date,
  endDate: Date,
  isPresent: { type: Boolean, default: false },
  department: String,
  projectMember: { type: [String], default: [] },
  role: String,
  description: String,
  verifyCount: { type: Number, default: 0 },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  verifications: { type: [VerificationReviewSchema], default: [] },
  companyKey: { type: String, index: true },
});

const EducationSchema = new mongoose.Schema({
  degreeTitle: String,
  startDate: Date,
  endDate: Date,
  isPresent: { type: Boolean, default: false },
  institute: String,
  instituteWebsite: String,
  degreeFile: String,
  hiddenFields: [String],
  verifyCount: { type: Number, default: 0 },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  verifications: { type: [VerificationReviewSchema], default: [] },
  instituteKey: { type: String, index: true },
  projects: { type: [ProjectSchema], default: [] },
});

const ExperienceSchema = new mongoose.Schema({
  jobTitle: String,
  startDate: Date,
  endDate: Date,
  isPresent: { type: Boolean, default: false },
  company: String,
  companyWebsite: String,
  experienceLetterFile: String,
  jobFunctions: [String],
  skills: { type: [String], default: [] },
  industry: String,
  hiddenFields: [String],
  verifyCount: { type: Number, default: 0 },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  verifications: { type: [VerificationReviewSchema], default: [] },
  companyKey: { type: String, index: true },
  projects: { type: [ProjectSchema], default: [] },
  lineManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // --- personal ---
    name: String,
    email: String,
    mobileCountryCode: String, // 👈 add
    mobile: String,
    street: String,
    city: String,
    country: String,
    zip: String,
    gender: String,
    residentStatus: String,
    nationality: String,
    dob: Date,
    resume: String,
    profilePic: String,
    profilePicPending: String,
    audioProfile: String,
    videoProfile: String,
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

    // --- projects ---
    projectLocked: { type: Boolean, default: false },
    projects: { type: [ProfileProjectSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);

