// controllers/verify.controller.js
const mongoose = require("mongoose");
const User = require("../models/auth.model");
const Profile = require("../models/Profile");

const toStr = (x) => (x ? String(x) : "");
const extractHex24 = (s = "") => {
  const m = String(s).match(/[a-f0-9]{24}/i);
  return m ? m[0] : null;
};

// ---------- EDUCATION ----------
exports.verifyEducation = async (req, res) => {
  try {
    const verifierId = req.user?.id;
    let { targetUserId, eduId } = req.params;

    targetUserId = extractHex24(targetUserId);
    eduId = extractHex24(eduId);

    if (!verifierId) return res.status(401).json({ message: "Unauthorized" });
    if (!targetUserId || !eduId)
      return res.status(400).json({ message: "targetUserId and eduId are required (24-hex ids)" });
    if (!mongoose.Types.ObjectId.isValid(targetUserId) || !mongoose.Types.ObjectId.isValid(eduId))
      return res.status(400).json({ message: "Invalid ids" });
    if (toStr(verifierId) === toStr(targetUserId))
      return res.status(400).json({ message: "You can't verify your own education" });

    // Load profiles (no transactions)
    const [verifierProfile, targetProfile] = await Promise.all([
      Profile.findOne({ user: verifierId }).lean(),
      Profile.findOne({ user: targetUserId }).lean(),
    ]);
    if (!targetProfile) return res.status(404).json({ message: "Target profile not found" });

    const edu = (targetProfile.education || []).find((e) => String(e._id) === eduId);
    if (!edu) return res.status(404).json({ message: "Education row not found" });

    // similarity rule: same institute (case-insensitive)
    const targetInstitute = (edu.institute || "").trim().toLowerCase();
    const eligible =
      targetInstitute &&
      Array.isArray(verifierProfile?.education) &&
      verifierProfile.education.some(
        (e) => (e?.institute || "").trim().toLowerCase() === targetInstitute
      );
    if (!eligible) return res.status(403).json({ message: "Not eligible (institute mismatch)" });

    // STEP 1: spend 1 credit if available
    const spent = await User.findOneAndUpdate(
      { _id: verifierId, "verifyCredits.education": { $gt: 0 } },
      { $inc: { "verifyCredits.education": -1 } },
      { new: true }
    ).lean();
    if (!spent) return res.status(403).json({ message: "No education verify credits left" });

    // STEP 2: add verification to target row atomically
    const upd = await Profile.updateOne(
      {
        user: targetUserId,
        "education._id": eduId,
        "education.verifiedBy": { $ne: verifierId },
      },
      {
        $addToSet: { "education.$.verifiedBy": verifierId },
        $inc: { "education.$.verifyCount": 1 },
      }
    );

    if (upd.modifiedCount === 0) {
      // refund verifier
      await User.updateOne(
        { _id: verifierId },
        { $inc: { "verifyCredits.education": 1 } }
      );
      return res.status(409).json({ message: "Already verified or row changed" });
    }

    // STEP 3: reward target user with +3 credits in education
    await User.updateOne(
      { _id: targetUserId },
      { $inc: { "verifyCredits.education": 1 } }
    );

    // Return fresh counts for UI
    const refreshed = await Profile.findOne({ user: targetUserId }).select("education").lean();
    return res.status(200).json({
      message: "Education verified",
      education: refreshed.education.map((row) => ({
        _id: row._id,
        institute: row.institute,
        verifyCount: row.verifyCount || 0,
      })),
    });
  } catch (err) {
    console.error("verifyEducation error:", err);
    return res.status(500).json({ message: "Failed to verify education" });
  }
};

// ---------- EXPERIENCE ----------
exports.verifyExperience = async (req, res) => {
  try {
    const verifierId = req.user?.id;
    let { targetUserId, expId } = req.params;

    targetUserId = extractHex24(targetUserId);
    expId = extractHex24(expId);

    if (!verifierId) return res.status(401).json({ message: "Unauthorized" });
    if (!targetUserId || !expId)
      return res.status(400).json({ message: "targetUserId and expId are required (24-hex ids)" });
    if (!mongoose.Types.ObjectId.isValid(targetUserId) || !mongoose.Types.ObjectId.isValid(expId))
      return res.status(400).json({ message: "Invalid ids" });
    if (toStr(verifierId) === toStr(targetUserId))
      return res.status(400).json({ message: "You can't verify your own experience" });

    // Load profiles
    const [verifierProfile, targetProfile] = await Promise.all([
      Profile.findOne({ user: verifierId }).lean(),
      Profile.findOne({ user: targetUserId }).lean(),
    ]);
    if (!targetProfile) return res.status(404).json({ message: "Target profile not found" });

    const exp = (targetProfile.experience || []).find((e) => String(e._id) === expId);
    if (!exp) return res.status(404).json({ message: "Experience row not found" });

    // similarity rule: same company (case-insensitive)
    const targetCompany = (exp.company || "").trim().toLowerCase();
    const eligible =
      targetCompany &&
      Array.isArray(verifierProfile?.experience) &&
      verifierProfile.experience.some(
        (e) => (e?.company || "").trim().toLowerCase() === targetCompany
      );
    if (!eligible) return res.status(403).json({ message: "Not eligible (company mismatch)" });

    // STEP 1: spend 1 credit if available
    const spent = await User.findOneAndUpdate(
      { _id: verifierId, "verifyCredits.experience": { $gt: 0 } },
      { $inc: { "verifyCredits.experience": -1 } },
      { new: true }
    ).lean();
    if (!spent) return res.status(403).json({ message: "No experience verify credits left" });

    // STEP 2: add verification to target row atomically
    const upd = await Profile.updateOne(
      {
        user: targetUserId,
        "experience._id": expId,
        "experience.verifiedBy": { $ne: verifierId },
      },
      {
        $addToSet: { "experience.$.verifiedBy": verifierId },
        $inc: { "experience.$.verifyCount": 1 },
      }
    );

    if (upd.modifiedCount === 0) {
      // refund verifier
      await User.updateOne(
        { _id: verifierId },
        { $inc: { "verifyCredits.experience": 1 } }
      );
      return res.status(409).json({ message: "Already verified or row changed" });
    }

    // STEP 3: reward target user with +3 credits in experience
    await User.updateOne(
      { _id: targetUserId },
      { $inc: { "verifyCredits.experience": 1 } }
    );

    const refreshed = await Profile.findOne({ user: targetUserId }).select("experience").lean();
    return res.status(200).json({
      message: "Experience verified",
      experience: refreshed.experience.map((row) => ({
        _id: row._id,
        company: row.company,
        verifyCount: row.verifyCount || 0,
      })),
    });
  } catch (err) {
    console.error("verifyExperience error:", err);
    return res.status(500).json({ message: "Failed to verify experience" });
  }
};
