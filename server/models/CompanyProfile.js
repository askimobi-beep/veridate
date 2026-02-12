const mongoose = require("mongoose");

const CompanyDocSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, default: "" },
    mimetype: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CompanyMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "viewer"],
      default: "viewer",
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CompanyProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    about: { type: String, default: "", trim: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    logo: {
      filename: { type: String, default: "" },
      originalName: { type: String, default: "" },
      mimetype: { type: String, default: "" },
    },
    role: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [CompanyMemberSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationNotes: { type: String, default: "" },
    docs: { type: [CompanyDocSchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyProfile", CompanyProfileSchema);
