const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // --- existing personal ---
    name: String,
    email: String,
    fatherName: String,
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
    education: [
      {
        degreeTitle: String,
        startDate: Date,
        endDate: Date,
        institute: String,
        instituteWebsite: String,
        degreeFile: String,
        hiddenFields: [String],

        verifyCount: { type: Number, default: 0 },
        verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // unique users
      },
    ],

    // --- experience (new) ---
    experienceLocked: { type: Boolean, default: false },
    experience: [
      {
        jobTitle: String,
        startDate: Date,
        endDate: Date,
        company: String,
        companyWebsite: String,
        experienceLetterFile: String, // stored filename
        jobFunctions: [String], // multiple selection
        industry: String,
        hiddenFields: [String], // names of fields user wants to hide
        verifyCount: { type: Number, default: 0 },
        verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
