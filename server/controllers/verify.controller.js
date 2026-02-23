const mongoose = require("mongoose");
const Profile = require("../models/Profile");

const toStr = (v) => String(v);
const extractHex24 = (s) => (s || "").trim().match(/^[a-f0-9]{24}$/i)?.[0];

const normalize = (val) => {
  if (val == null) return "";
  const s = typeof val === "string" ? val : String(val);
  return s.trim().toLowerCase().replace(/\s+/g, " ");
};

const normalizeInstitute = normalize;
const normalizeCompany = normalize;

/**
 * Returns overlap in days between two date ranges.
 * A null/undefined end date is treated as "ongoing" (today).
 * Returns 0 if no overlap or if either start date is missing.
 */
const overlapDays = (startA, endA, startB, endB) => {
  if (!startA || !startB) return 0;
  const s = Math.max(new Date(startA).getTime(), new Date(startB).getTime());
  const e = Math.min(
    endA ? new Date(endA).getTime() : Date.now(),
    endB ? new Date(endB).getTime() : Date.now()
  );
  if (e <= s) return 0;
  return (e - s) / (1000 * 60 * 60 * 24);
};


exports.verifyEducation = async (req, res) => {
  try {
    const verifierId = req.user?.id;
    let { targetUserId, eduId } = req.params;
    const { rating: rawRating, comment: rawComment } = req.body || {};

    targetUserId = extractHex24(targetUserId);
    eduId = extractHex24(eduId);

    if (!verifierId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!targetUserId || !eduId) {
      return res
        .status(400)
        .json({ message: "targetUserId and eduId are required" });
    }
    if (
      !mongoose.Types.ObjectId.isValid(targetUserId) ||
      !mongoose.Types.ObjectId.isValid(eduId)
    ) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    if (toStr(verifierId) === toStr(targetUserId)) {
      return res
        .status(400)
        .json({ message: "You can't verify your own education" });
    }

    const parsedRating = Number(rawRating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ message: "A star rating between 1 and 5 is required" });
    }

    const commentText =
      typeof rawComment === "string"
        ? rawComment.trim().slice(0, 1000)
        : "";

    // 1) load target edu row
    const targetProfile = await Profile.findOne({ user: targetUserId }).lean();
    if (!targetProfile)
      return res.status(404).json({ message: "Target profile not found" });

    const edu = (targetProfile.education || []).find((e) => String(e._id) === eduId);
    if (!edu) return res.status(404).json({ message: "Education row not found" });

    const institute = edu.institute || "";
    const instituteKey = edu.instituteKey || normalizeInstitute(institute);
    if (!instituteKey) {
      return res
        .status(400)
        .json({ message: "Target education has no institute" });
    }

    // 2) eligibility: verifier must have same institute AND overlap >= 1 month
    const verifierProfile = await Profile.findOne({ user: verifierId }).lean();
    const matchingRows = (verifierProfile?.education || []).filter(
      (e) => (e.instituteKey || normalizeInstitute(e.institute)) === instituteKey
    );

    if (!matchingRows.length) {
      return res
        .status(403)
        .json({ message: "Not eligible (institute mismatch)" });
    }

    const hasOverlap = matchingRows.some(
      (row) => overlapDays(row.startDate, row.endDate, edu.startDate, edu.endDate) >= 30
    );

    if (!hasOverlap) {
      return res
        .status(403)
        .json({ message: "Not eligible (no date overlap of at least 30 days at the same institute)" });
    }

    // 3) add verification to target row
    const oid = new mongoose.Types.ObjectId(verifierId);
    const eduOid = new mongoose.Types.ObjectId(eduId);

    const upd = await Profile.updateOne(
      {
        user: targetUserId,
        education: { $elemMatch: { _id: eduOid, verifiedBy: { $nin: [oid] } } },
      },
      {
        $addToSet: { "education.$.verifiedBy": oid },
        $inc: { "education.$.verifyCount": 1 },
        $push: {
          "education.$.verifications": {
            user: oid,
            rating: parsedRating,
            comment: commentText,
            createdAt: new Date(),
          },
        },
      }
    );

    if (upd.modifiedCount === 0) {
      const fresh = await Profile.findOne(
        { user: targetUserId, "education._id": eduOid },
        { "education.$": 1 }
      ).lean();

      if (!fresh) {
        return res
          .status(404)
          .json({ message: "Education row not found (race)" });
      }

      const row = fresh.education?.[0];
      const already =
        Array.isArray(row?.verifiedBy) &&
        row.verifiedBy.some((x) => String(x) === String(oid));

      return res.status(409).json({
        message: already
          ? "Already verified this user's education"
          : "Row changed or invalid eduId for the selected user",
      });
    }

    // 4) return refreshed education records
    const refreshedTargetProfile = await Profile.findOne({ user: targetUserId })
      .select("education")
      .populate({
        path: "education.verifications.user",
        select: "firstName lastName name email profilePic",
      })
      .lean();

    return res.status(200).json({
      message: "Education verified",
      education: (refreshedTargetProfile?.education || []).map((r) => ({
        _id: r._id,
        institute: r.institute,
        verifyCount: r.verifyCount || 0,
        verifiedBy: r.verifiedBy || [],
        verifications: (r.verifications || []).map((entry) => ({
          user: entry.user,
          rating: entry.rating,
          comment: entry.comment,
          createdAt: entry.createdAt,
        })),
      })),
    });
  } catch (err) {
    console.error("verifyEducation error:", err);
    return res.status(500).json({ message: "Failed to verify education" });
  }
};



exports.verifyExperience = async (req, res) => {
  try {
    const verifierId = req.user?.id;
    let { targetUserId, expId } = req.params;
    const { rating: rawRating, comment: rawComment } = req.body || {};

    targetUserId = extractHex24(targetUserId);
    expId = extractHex24(expId);

    if (!verifierId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!targetUserId || !expId) {
      return res
        .status(400)
        .json({ message: "targetUserId and expId are required (24-hex ids)" });
    }
    if (
      !mongoose.Types.ObjectId.isValid(targetUserId) ||
      !mongoose.Types.ObjectId.isValid(expId)
    ) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    if (toStr(verifierId) === toStr(targetUserId)) {
      return res
        .status(400)
        .json({ message: "You can't verify your own experience" });
    }

    const parsedRating = Number(rawRating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ message: "A star rating between 1 and 5 is required" });
    }

    const commentText =
      typeof rawComment === "string"
        ? rawComment.trim().slice(0, 1000)
        : "";

    // 1) load target exp row
    const targetProfile = await Profile.findOne({ user: targetUserId }).lean();
    if (!targetProfile)
      return res.status(404).json({ message: "Target profile not found" });

    const exp = (targetProfile.experience || []).find(
      (e) => String(e._id) === expId
    );
    if (!exp) return res.status(404).json({ message: "Experience row not found" });

    const company = exp.company || "";
    const companyKey = exp.companyKey || normalizeCompany(company);
    if (!companyKey) {
      return res
        .status(400)
        .json({ message: "Target experience has no company" });
    }

    // 2) eligibility: verifier must have same company AND overlap >= 1 month
    const verifierProfile = await Profile.findOne({ user: verifierId }).lean();
    const matchingRows = (verifierProfile?.experience || []).filter(
      (e) => (e.companyKey || normalizeCompany(e.company)) === companyKey
    );

    if (!matchingRows.length) {
      return res
        .status(403)
        .json({ message: "Not eligible (company mismatch)" });
    }

    const hasOverlap = matchingRows.some(
      (row) => overlapDays(row.startDate, row.endDate, exp.startDate, exp.endDate) >= 30
    );

    if (!hasOverlap) {
      return res
        .status(403)
        .json({ message: "Not eligible (no date overlap of at least 30 days at the same company)" });
    }

    // 3) add verification to target row
    const oid = new mongoose.Types.ObjectId(verifierId);
    const expOid = new mongoose.Types.ObjectId(expId);

    const upd = await Profile.updateOne(
      {
        user: targetUserId,
        experience: { $elemMatch: { _id: expOid, verifiedBy: { $nin: [oid] } } },
      },
      {
        $addToSet: { "experience.$.verifiedBy": oid },
        $inc: { "experience.$.verifyCount": 1 },
        $push: {
          "experience.$.verifications": {
            user: oid,
            rating: parsedRating,
            comment: commentText,
            createdAt: new Date(),
          },
        },
      }
    );

    if (upd.modifiedCount === 0) {
      const fresh = await Profile.findOne(
        { user: targetUserId, "experience._id": expOid },
        { "experience.$": 1 }
      ).lean();

      if (!fresh) {
        return res
          .status(404)
          .json({ message: "Experience row not found (race)" });
      }

      const row = fresh.experience?.[0];
      const already =
        Array.isArray(row?.verifiedBy) &&
        row.verifiedBy.some((x) => String(x) === String(oid));

      return res.status(409).json({
        message: already
          ? "Already verified this user's experience"
          : "Row changed or invalid expId for the selected user",
      });
    }

    // 4) return refreshed experience records
    const refreshedTargetProfile = await Profile.findOne({ user: targetUserId })
      .select("experience")
      .populate({
        path: "experience.verifications.user",
        select: "firstName lastName name email profilePic",
      })
      .lean();

    return res.status(200).json({
      message: "Experience verified",
      experience: (refreshedTargetProfile?.experience || []).map((r) => ({
        _id: r._id,
        company: r.company,
        verifyCount: r.verifyCount || 0,
        verifiedBy: r.verifiedBy || [],
        verifications: (r.verifications || []).map((entry) => ({
          user: entry.user,
          rating: entry.rating,
          comment: entry.comment,
          createdAt: entry.createdAt,
        })),
      })),
    });
  } catch (err) {
    console.error("verifyExperience error:", err);
    return res.status(500).json({ message: "Failed to verify experience" });
  }
};

exports.verifyProject = async (req, res) => {
  try {
    const verifierId = req.user?.id;
    let { targetUserId, projectId } = req.params;
    const { rating: rawRating, comment: rawComment } = req.body || {};

    targetUserId = extractHex24(targetUserId);
    projectId = extractHex24(projectId);

    if (!verifierId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!targetUserId || !projectId) {
      return res.status(400).json({
        message: "targetUserId and projectId are required (24-hex ids)",
      });
    }
    if (
      !mongoose.Types.ObjectId.isValid(targetUserId) ||
      !mongoose.Types.ObjectId.isValid(projectId)
    ) {
      return res.status(400).json({ message: "Invalid ids" });
    }
    if (toStr(verifierId) === toStr(targetUserId)) {
      return res
        .status(400)
        .json({ message: "You can't verify your own project" });
    }

    const parsedRating = Number(rawRating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ message: "A star rating between 1 and 5 is required" });
    }

    const commentText =
      typeof rawComment === "string"
        ? rawComment.trim().slice(0, 1000)
        : "";

    const targetProfile = await Profile.findOne({ user: targetUserId }).lean();
    if (!targetProfile)
      return res.status(404).json({ message: "Target profile not found" });

    const project = (targetProfile.projects || []).find(
      (p) => String(p._id) === projectId
    );
    if (!project)
      return res.status(404).json({ message: "Project row not found" });

    const company = project.company || "";
    const companyKey = project.companyKey || normalizeCompany(company);
    if (!companyKey) {
      return res
        .status(400)
        .json({ message: "Target project has no company" });
    }

    // eligibility: verifier must have same company in experience AND overlap >= 1 month with project dates
    const verifierProfile = await Profile.findOne({ user: verifierId }).lean();
    const matchingRows = (verifierProfile?.experience || []).filter(
      (e) => (e.companyKey || normalizeCompany(e.company)) === companyKey
    );

    if (!matchingRows.length) {
      return res
        .status(403)
        .json({ message: "Not eligible (company mismatch)" });
    }

    const hasOverlap = matchingRows.some(
      (row) => overlapDays(row.startDate, row.endDate, project.startDate, project.endDate) >= 30
    );

    if (!hasOverlap) {
      return res
        .status(403)
        .json({ message: "Not eligible (no date overlap of at least 30 days at the same company)" });
    }

    // add verification to target row
    const oid = new mongoose.Types.ObjectId(verifierId);
    const projOid = new mongoose.Types.ObjectId(projectId);

    const upd = await Profile.updateOne(
      {
        user: targetUserId,
        projects: { $elemMatch: { _id: projOid, verifiedBy: { $nin: [oid] } } },
      },
      {
        $addToSet: { "projects.$.verifiedBy": oid },
        $inc: { "projects.$.verifyCount": 1 },
        $push: {
          "projects.$.verifications": {
            user: oid,
            rating: parsedRating,
            comment: commentText,
            createdAt: new Date(),
          },
        },
      }
    );

    if (upd.modifiedCount === 0) {
      const fresh = await Profile.findOne(
        { user: targetUserId, "projects._id": projOid },
        { "projects.$": 1 }
      ).lean();

      if (!fresh) {
        return res
          .status(404)
          .json({ message: "Project row not found (race)" });
      }

      const row = fresh.projects?.[0];
      const already =
        Array.isArray(row?.verifiedBy) &&
        row.verifiedBy.some((x) => String(x) === String(oid));

      return res.status(409).json({
        message: already
          ? "Already verified this user's project"
          : "Row changed or invalid projectId for the selected user",
      });
    }

    // return refreshed project records
    const refreshedTargetProfile = await Profile.findOne({ user: targetUserId })
      .select("projects")
      .populate({
        path: "projects.verifications.user",
        select: "firstName lastName name email profilePic",
      })
      .lean();

    return res.status(200).json({
      message: "Project verified",
      projects: (refreshedTargetProfile?.projects || []).map((r) => ({
        _id: r._id,
        company: r.company,
        verifyCount: r.verifyCount || 0,
        verifiedBy: r.verifiedBy || [],
        verifications: (r.verifications || []).map((entry) => ({
          user: entry.user,
          rating: entry.rating,
          comment: entry.comment,
          createdAt: entry.createdAt,
        })),
      })),
    });
  } catch (err) {
    console.error("verifyProject error:", err);
    return res.status(500).json({ message: "Failed to verify project" });
  }
};
