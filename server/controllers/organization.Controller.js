const crypto = require("crypto");
const User = require("../models/auth.model");
const Profile = require("../models/Profile");
const { normalizeInstitute } = require("../utils/normalize");
const { sendPasswordResetEmail } = require("../utils/emailService");

const ORG_ROLES = new Set(["company", "university"]);
const websiteRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const normalizeRole = (role) => String(role || "").toLowerCase().trim();

const buildDisplayName = (profile, user) => {
  const nameFromProfile = String(profile?.name || "").trim();
  if (nameFromProfile) return nameFromProfile;
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
};

const redactPersonal = (profile) => {
  const hidden = new Set(profile?.personalHiddenFields || []);
  return {
    email: hidden.has("email") ? "" : profile?.email || "",
    mobile: hidden.has("mobile") ? "" : profile?.mobile || "",
  };
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, email, role, contact, website } = req.body || {};
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const trimmedContact = String(contact || "").trim();
    const trimmedWebsite = String(website || "").trim();
    const normalizedRole = normalizeRole(role);

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedContact ||
      !trimmedWebsite ||
      !ORG_ROLES.has(normalizedRole)
    ) {
      return res.status(400).json({
        message:
          "name, email, role (company/university), contact, and website are required",
      });
    }

    if (!websiteRegex.test(trimmedWebsite)) {
      return res
        .status(400)
        .json({ message: "Website must be a valid https URL" });
    }

    const existingEmail = await User.findOne({ email: trimmedEmail }).lean();
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const organizationKey = normalizeInstitute(trimmedName);
    if (!organizationKey) {
      return res.status(400).json({ message: "Organization name is required" });
    }

    const existingOrg = await User.findOne({
      role: normalizedRole,
      organizationKey,
    }).lean();
    if (existingOrg) {
      return res.status(409).json({ message: "Organization already exists" });
    }

    const user = await User.create({
      email: trimmedEmail,
      role: normalizedRole,
      organizationName: trimmedName,
      organizationKey,
      contact: trimmedContact,
      website: trimmedWebsite,
      isVerified: false,
      isBlocked: false,
      provider: "local",
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const baseUrl = process.env.CLIENT_APP_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return res.status(201).json({
      message: "Organization registered. Invite email sent.",
      data: {
        _id: user._id,
        name: user.organizationName,
        role: user.role,
        email: user.email,
        contact: user.contact,
        website: user.website,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("createOrganization error:", err);
    return res.status(500).json({ message: "Failed to create organization" });
  }
};

exports.listOrganizationsAdmin = async (req, res) => {
  try {
    const rows = await User.find({ role: { $in: Array.from(ORG_ROLES) } })
      .select("organizationName role email contact website createdAt password")
      .sort({ organizationName: 1 })
      .lean();

    const data = rows.map((u) => ({
      _id: u._id,
      name: u.organizationName || "",
      role: u.role,
      email: u.email,
      contact: u.contact || "",
      website: u.website || "",
      createdAt: u.createdAt,
      hasPassword: !!u.password,
    }));

    return res.status(200).json({ data });
  } catch (err) {
    console.error("listOrganizationsAdmin error:", err);
    return res.status(500).json({ message: "Failed to fetch organizations" });
  }
};

exports.listOrganizations = async (req, res) => {
  try {
    const roleParam = String(req.query.role || "")
      .toLowerCase()
      .trim();
    const roles = roleParam
      ? roleParam
          .split(",")
          .map((r) => r.trim())
          .filter((r) => ORG_ROLES.has(r))
      : Array.from(ORG_ROLES);

    const rows = await User.find({
      role: { $in: roles },
      organizationName: { $ne: null },
    })
      .select("organizationName role organizationKey website")
      .sort({ organizationName: 1 })
      .lean();

    const data = rows.map((u) => ({
      _id: u._id,
      name: u.organizationName || "",
      role: u.role,
      key: u.organizationKey || normalizeInstitute(u.organizationName || ""),
      website: u.website || "",
    }));

    return res.status(200).json({ data });
  } catch (err) {
    console.error("listOrganizations error:", err);
    return res.status(500).json({ message: "Failed to fetch organizations" });
  }
};

exports.getOrganizationDashboard = async (req, res) => {
  try {
    const role = normalizeRole(req.user?.role);
    if (!ORG_ROLES.has(role)) {
      return res.status(403).json({ message: "Organization access only" });
    }

    const orgUser = await User.findById(req.user.id).lean();
    if (!orgUser) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const orgKey =
      orgUser.organizationKey ||
      normalizeInstitute(orgUser.organizationName || "");
    if (!orgKey) {
      return res.status(400).json({ message: "Organization key missing" });
    }

    const query =
      role === "company"
        ? { "experience.companyKey": orgKey }
        : { "education.instituteKey": orgKey };

    const profiles = await Profile.find(query)
      .populate({ path: "user", select: "firstName lastName email" })
      .lean();

    const users = (profiles || []).map((p) => {
      const name = buildDisplayName(p, p.user);
      const redacted = redactPersonal(p);
      const base = {
        userId:
          typeof p.user === "object" && p.user?._id ? p.user._id : p.user,
        profileId: p._id,
        name,
        email: redacted.email || "",
        mobile: redacted.mobile || "",
        city: p.city || "",
        country: p.country || "",
      };

      if (role === "company") {
        const matches = (p.experience || [])
          .filter(
            (e) =>
              (e.companyKey || normalizeInstitute(e.company || "")) === orgKey
          )
          .map((e) => ({
            jobTitle: e.jobTitle || "",
            company: e.company || "",
            startDate: e.startDate || "",
            endDate: e.endDate || "",
            industry: e.industry || "",
            companyWebsite: e.companyWebsite || "",
          }));
        return { ...base, experiences: matches };
      }

      const matches = (p.education || [])
        .filter(
          (e) =>
            (e.instituteKey || normalizeInstitute(e.institute || "")) === orgKey
        )
        .map((e) => ({
          degreeTitle: e.degreeTitle || "",
          institute: e.institute || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          instituteWebsite: e.instituteWebsite || "",
        }));
      return { ...base, educations: matches };
    });

    return res.status(200).json({
      organization: {
        name: orgUser.organizationName || "",
        role: orgUser.role,
        email: orgUser.email,
        contact: orgUser.contact || "",
        website: orgUser.website || "",
      },
      totalUsers: users.length,
      users,
    });
  } catch (err) {
    console.error("getOrganizationDashboard error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load organization dashboard" });
  }
};
