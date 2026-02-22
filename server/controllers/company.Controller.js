const crypto = require("crypto");
const CompanyProfile = require("../models/CompanyProfile");
const CompanyInvite = require("../models/CompanyInvite");
const JobPost = require("../models/JobPost");

const buildDocPayload = (files = []) =>
  files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname || "",
    mimetype: f.mimetype || "",
  }));

const buildSingleFilePayload = (file) =>
  file
    ? {
        filename: file.filename || "",
        originalName: file.originalname || "",
        mimetype: file.mimetype || "",
      }
    : { filename: "", originalName: "", mimetype: "" };

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getMemberRole = (company, userId) => {
  if (!company || !userId) return null;
  if (String(company.createdBy) === String(userId)) return "owner";
  const member = Array.isArray(company.members)
    ? company.members.find((m) => String(m.user) === String(userId))
    : null;
  return member?.role || null;
};

const requireRole = (company, userId, roles) => {
  const role = getMemberRole(company, userId);
  if (!role || !roles.includes(role)) return null;
  return role;
};

exports.createCompany = async (req, res) => {
  try {
    const { name, about = "", phone, website, address, role, documentType = "" } = req.body || {};
    if (!name || !phone || !website || !address || !role || !about || !documentType) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingPending = await CompanyProfile.findOne({
      createdBy: req.user.id,
      status: "pending",
    })
      .select("_id name createdAt")
      .lean();
    if (existingPending) {
      return res.status(409).json({
        message:
          "You already have a pending company page request. Please wait for admin approval/rejection before creating another one.",
      });
    }

    const docsFiles = Array.isArray(req.files?.companyDocs) ? req.files.companyDocs : [];
    const logoFile = Array.isArray(req.files?.companyLogo) ? req.files.companyLogo[0] : null;
    const docs = buildDocPayload(docsFiles);
    if (!docs.length) {
      return res.status(400).json({ message: "At least one document is required." });
    }

    const company = await CompanyProfile.create({
      name: String(name).trim(),
      about: String(about).trim(),
      phone: String(phone).trim(),
      website: String(website).trim(),
      address: String(address).trim(),
      documentType: String(documentType).trim(),
      logo: buildSingleFilePayload(logoFile),
      role: String(role).trim(),
      createdBy: req.user.id,
      members: [
        {
          user: req.user.id,
          role: "owner",
          invitedBy: req.user.id,
          joinedAt: new Date(),
        },
      ],
      docs,
      status: "pending",
      submittedAt: new Date(),
    });

    return res.status(201).json({
      message:
        "Your submission has been received. Verification will take up to 5 business days.",
      company,
    });
  } catch (err) {
    console.error("createCompany error:", err);
    return res.status(500).json({ message: "Failed to create company profile." });
  }
};

exports.listMyCompanies = async (req, res) => {
  try {
    const rows = await CompanyProfile.find({
      $or: [{ createdBy: req.user.id }, { "members.user": req.user.id }],
    })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: rows });
  } catch (err) {
    console.error("listMyCompanies error:", err);
    return res.status(500).json({ message: "Failed to fetch companies." });
  }
};

exports.listApprovedCompanies = async (_req, res) => {
  try {
    const rows = await CompanyProfile.find({ status: "approved" })
      .select("name _id")
      .sort({ name: 1 })
      .lean();
    return res.json({ data: rows });
  } catch (err) {
    console.error("listApprovedCompanies error:", err);
    return res.status(500).json({ message: "Failed to fetch approved companies." });
  }
};

exports.getCompanyPublic = async (req, res) => {
  try {
    const company = await CompanyProfile.findById(req.params.id).lean();
    if (!company) return res.status(404).json({ message: "Company not found." });
    const myRole = getMemberRole(company, req.user?.id);
    if (!myRole) {
      return res.status(403).json({ message: "You do not have access to this company." });
    }
    return res.json({ data: company, myRole });
  } catch (err) {
    console.error("getCompanyPublic error:", err);
    return res.status(500).json({ message: "Failed to load company." });
  }
};

exports.listPendingCompanies = async (req, res) => {
  try {
    const status = String(req.query?.status || "pending");
    const query =
      status === "all"
        ? {}
        : status === "rejected"
        ? { status: "rejected" }
        : status === "approved"
        ? { status: "approved" }
        : { status: "pending" };
    const rows = await CompanyProfile.find(query)
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: rows });
  } catch (err) {
    console.error("listPendingCompanies error:", err);
    return res.status(500).json({ message: "Failed to fetch pending companies." });
  }
};

exports.approveCompany = async (req, res) => {
  try {
    const { notes = "" } = req.body || {};
    const company = await CompanyProfile.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found." });
    company.status = "approved";
    company.verificationNotes = String(notes || "");
    company.reviewedAt = new Date();
    company.approvedAt = new Date();
    await company.save();
    return res.json({ message: "Company approved.", company });
  } catch (err) {
    console.error("approveCompany error:", err);
    return res.status(500).json({ message: "Failed to approve company." });
  }
};

exports.rejectCompany = async (req, res) => {
  try {
    const { notes = "" } = req.body || {};
    const company = await CompanyProfile.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found." });
    company.status = "rejected";
    company.verificationNotes = String(notes || "");
    company.reviewedAt = new Date();
    await company.save();
    return res.json({ message: "Company rejected.", company });
  } catch (err) {
    console.error("rejectCompany error:", err);
    return res.status(500).json({ message: "Failed to reject company." });
  }
};

exports.createJobPost = async (req, res) => {
  try {
    const { title, description, location = "" } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const company = await CompanyProfile.findById(req.params.companyId);
    if (!company) return res.status(404).json({ message: "Company not found." });
    if (company.status !== "approved") {
      return res.status(400).json({ message: "Company is not approved." });
    }
    const role = requireRole(company, req.user.id, ["owner", "admin", "manager"]);
    if (!role) {
      return res.status(403).json({ message: "You do not have permission to post jobs." });
    }

    const post = await JobPost.create({
      company: company._id,
      createdBy: req.user.id,
      title: String(title).trim(),
      description: String(description).trim(),
      location: String(location || "").trim(),
    });

    return res.status(201).json({ message: "Job post created.", data: post });
  } catch (err) {
    console.error("createJobPost error:", err);
    return res.status(500).json({ message: "Failed to create job post." });
  }
};

exports.createInvite = async (req, res) => {
  try {
    const { role = "viewer", expiresInDays = 7, usageLimit = 1 } = req.body || {};
    const company = await CompanyProfile.findById(req.params.companyId);
    if (!company) return res.status(404).json({ message: "Company not found." });

    const callerRole = requireRole(company, req.user.id, ["owner", "admin"]);
    if (!callerRole) {
      return res.status(403).json({ message: "Not allowed to invite users." });
    }

    const normalizedRole = normalizeRole(role);
    if (!["admin", "manager", "viewer"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const expiryDays = Number(expiresInDays) || 7;
    const limit = Math.max(1, Number(usageLimit) || 1);
    const token = crypto.randomBytes(24).toString("hex");

    const invite = await CompanyInvite.create({
      company: company._id,
      token,
      role: normalizedRole,
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
      usageLimit: limit,
    });

    return res.status(201).json({
      message: "Invite created.",
      data: invite,
    });
  } catch (err) {
    console.error("createInvite error:", err);
    return res.status(500).json({ message: "Failed to create invite." });
  }
};

exports.getInvitePreview = async (req, res) => {
  try {
    const invite = await CompanyInvite.findOne({ token: req.params.token })
      .populate("company", "name")
      .populate("createdBy", "name firstName lastName email")
      .lean();
    if (!invite) return res.status(404).json({ message: "Invite not found." });

    const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
    const isUsed = invite.usedCount >= invite.usageLimit;

    if (isExpired || isUsed) {
      return res.status(400).json({ message: "Invite expired or invalid." });
    }

    const inviterName =
      invite.createdBy?.name ||
      [invite.createdBy?.firstName, invite.createdBy?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      invite.createdBy?.email ||
      "Company Admin";

    return res.json({
      data: {
        companyId: invite.company?._id,
        companyName: invite.company?.name || "Company",
        role: invite.role,
        invitedBy: inviterName,
        expiresAt: invite.expiresAt,
        usageLimit: invite.usageLimit,
        usedCount: invite.usedCount,
      },
    });
  } catch (err) {
    console.error("getInvitePreview error:", err);
    return res.status(500).json({ message: "Failed to load invite." });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const invite = await CompanyInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ message: "Invite not found." });

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Invite expired or invalid." });
    }
    if (invite.usedCount >= invite.usageLimit) {
      return res.status(400).json({ message: "Invite expired or invalid." });
    }

    const company = await CompanyProfile.findById(invite.company);
    if (!company) return res.status(404).json({ message: "Company not found." });

    const existingRole = getMemberRole(company, req.user.id);
    if (existingRole) {
      return res.json({
        message: "You already have access.",
        alreadyAccess: true,
        companyId: company._id,
      });
    }

    company.members = Array.isArray(company.members) ? company.members : [];
    company.members.push({
      user: req.user.id,
      role: invite.role,
      invitedBy: invite.createdBy,
      joinedAt: new Date(),
    });
    await company.save();

    invite.usedCount += 1;
    invite.usedBy = Array.isArray(invite.usedBy) ? invite.usedBy : [];
    invite.usedBy.push(req.user.id);
    await invite.save();

    return res.json({
      message: "Invite accepted.",
      companyId: company._id,
    });
  } catch (err) {
    console.error("acceptInvite error:", err);
    return res.status(500).json({ message: "Failed to accept invite." });
  }
};

exports.declineInvite = async (req, res) => {
  try {
    const invite = await CompanyInvite.findOne({ token: req.params.token });
    if (!invite) return res.status(404).json({ message: "Invite not found." });

    invite.declinedBy = Array.isArray(invite.declinedBy) ? invite.declinedBy : [];
    if (!invite.declinedBy.some((id) => String(id) === String(req.user.id))) {
      invite.declinedBy.push(req.user.id);
      await invite.save();
    }

    return res.json({ message: "Invite declined." });
  } catch (err) {
    console.error("declineInvite error:", err);
    return res.status(500).json({ message: "Failed to decline invite." });
  }
};

exports.listMembers = async (req, res) => {
  try {
    const company = await CompanyProfile.findById(req.params.companyId)
      .populate("members.user", "name firstName lastName email")
      .populate("createdBy", "name firstName lastName email");
    if (!company) return res.status(404).json({ message: "Company not found." });

    const callerRole = requireRole(company, req.user.id, ["owner", "admin"]);
    if (!callerRole) {
      return res.status(403).json({ message: "Not allowed to manage members." });
    }

    const ownerId = String(company.createdBy);
    const members = (company.members || []).map((m) => ({
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt,
      isOwner: String(m.user?._id || m.user) === ownerId,
    }));

    const ownerIncluded = members.some(
      (m) => String(m.user?._id || m.user) === ownerId
    );
    if (!ownerIncluded) {
      members.unshift({
        user: company.createdBy,
        role: "owner",
        joinedAt: company.createdAt,
        isOwner: true,
      });
    }

    return res.json({ data: members });
  } catch (err) {
    console.error("listMembers error:", err);
    return res.status(500).json({ message: "Failed to load members." });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body || {};
    const normalizedRole = normalizeRole(role);
    if (!["admin", "manager", "viewer"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const company = await CompanyProfile.findById(req.params.companyId);
    if (!company) return res.status(404).json({ message: "Company not found." });

    const callerRole = requireRole(company, req.user.id, ["owner", "admin"]);
    if (!callerRole) {
      return res.status(403).json({ message: "Not allowed to manage members." });
    }

    const member = (company.members || []).find(
      (m) => String(m.user) === String(req.params.memberId)
    );
    if (!member) return res.status(404).json({ message: "Member not found." });

    if (String(company.createdBy) === String(member.user)) {
      return res.status(400).json({ message: "Owner role cannot be changed." });
    }

    member.role = normalizedRole;
    await company.save();
    return res.json({ message: "Role updated." });
  } catch (err) {
    console.error("updateMemberRole error:", err);
    return res.status(500).json({ message: "Failed to update role." });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const company = await CompanyProfile.findById(req.params.companyId);
    if (!company) return res.status(404).json({ message: "Company not found." });

    const callerRole = requireRole(company, req.user.id, ["owner", "admin"]);
    if (!callerRole) {
      return res.status(403).json({ message: "Not allowed to manage members." });
    }

    if (String(company.createdBy) === String(req.params.memberId)) {
      return res.status(400).json({ message: "Owner cannot be removed." });
    }

    company.members = (company.members || []).filter(
      (m) => String(m.user) !== String(req.params.memberId)
    );
    await company.save();
    return res.json({ message: "Member removed." });
  } catch (err) {
    console.error("removeMember error:", err);
    return res.status(500).json({ message: "Failed to remove member." });
  }
};

exports.listJobPosts = async (req, res) => {
  try {
    const posts = await JobPost.find({ company: req.params.companyId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: posts });
  } catch (err) {
    console.error("listJobPosts error:", err);
    return res.status(500).json({ message: "Failed to fetch job posts." });
  }
};

exports.searchAllJobs = async (req, res) => {
  try {
    const { title, location, company: companyName, page: rawPage, limit: rawLimit } = req.query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.min(50, Math.max(1, Number(rawLimit) || 10));
    const skip = (page - 1) * limit;

    const jobFilter = { status: "active" };

    if (title) {
      jobFilter.title = { $regex: title, $options: "i" };
    }
    if (location) {
      jobFilter.location = { $regex: location, $options: "i" };
    }

    // If company name filter provided, find matching approved company IDs first
    if (companyName) {
      const matchingCompanies = await CompanyProfile.find({
        name: { $regex: companyName, $options: "i" },
        status: "approved",
      })
        .select("_id")
        .lean();
      const ids = matchingCompanies.map((c) => c._id);
      if (!ids.length) {
        return res.json({ data: [], total: 0, page, limit });
      }
      jobFilter.company = { $in: ids };
    }

    const [data, total] = await Promise.all([
      JobPost.find(jobFilter)
        .populate("company", "name logo about")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobPost.countDocuments(jobFilter),
    ]);

    return res.json({ data, total, page, limit });
  } catch (err) {
    console.error("searchAllJobs error:", err);
    return res.status(500).json({ message: "Failed to search jobs." });
  }
};

exports.updateCompanyAbout = async (req, res) => {
  try {
    const { about = "" } = req.body || {};
    if (!String(about).trim()) {
      return res.status(400).json({ message: "About is required." });
    }

    const company = await CompanyProfile.findById(req.params.companyId);
    if (!company) return res.status(404).json({ message: "Company not found." });

    const role = requireRole(company, req.user.id, ["owner", "admin", "manager"]);
    if (!role) {
      return res.status(403).json({ message: "You do not have permission to edit company page." });
    }

    company.about = String(about).trim();
    await company.save();
    return res.json({ message: "Company about updated.", data: company });
  } catch (err) {
    console.error("updateCompanyAbout error:", err);
    return res.status(500).json({ message: "Failed to update company about." });
  }
};
