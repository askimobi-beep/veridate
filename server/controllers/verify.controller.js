const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const User = require("../models/auth.model");



const toStr = (v) => String(v);
const extractHex24 = (s) => (s || "").trim().match(/^[a-f0-9]{24}$/i)?.[0];

const summarizeEduCredits = (userDoc) => {
  const buckets = (userDoc?.verifyCredits?.education || []).map((b) => {
    const available = Number(b.available || 0);
    const used = Number(b.used || 0);
    return {
      institute: b.institute,
      instituteKey: b.instituteKey,
      available,
      used,
      total: available + used, // computed, not stored
    };
  });

  const totals = buckets.reduce(
    (acc, b) => {
      acc.available += b.available;
      acc.used += b.used;
      return acc;
    },
    { available: 0, used: 0 }
  );

  return { buckets, totals: { ...totals, total: totals.available + totals.used } };
};


const normalize = (val) => {
  if (val == null) return "";
  // coerce non-strings safely
  const s = typeof val === "string" ? val : String(val);
  return s.trim().toLowerCase().replace(/\s+/g, " ")
};

const normalizeInstitute = normalize;
const normalizeCompany = normalize;





exports.verifyEducation = async (req, res) => {
  try {
    const verifierId = req.user?.id;
    let { targetUserId, eduId } = req.params;

    // sanitize ids
    targetUserId = extractHex24(targetUserId);
    eduId = extractHex24(eduId);

    if (!verifierId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!targetUserId || !eduId) {
      return res
        .status(400)
        .json({ message: "targetUserId and eduId are required (24-hex ids)" });
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

    // 1) load target edu row
    const targetProfile = await Profile.findOne({ user: targetUserId }).lean();
    if (!targetProfile)
      return res.status(404).json({ message: "Target profile not found" });

    const edu = (targetProfile.education || []).find(
      (e) => String(e._id) === eduId
    );
    if (!edu) return res.status(404).json({ message: "Education row not found" });

    const institute = edu.institute || "";
    const instituteKey = edu.instituteKey || normalizeInstitute(institute);
    if (!instituteKey) {
      return res
        .status(400)
        .json({ message: "Target education has no institute" });
    }

    // 2) eligibility: verifier must also have same-institute row on their profile
    const verifierProfile = await Profile.findOne({ user: verifierId }).lean();
    const eligible =
      Array.isArray(verifierProfile?.education) &&
      verifierProfile.education.some(
        (e) =>
          (e.instituteKey || normalizeInstitute(e.institute)) === instituteKey
      );
    if (!eligible) {
      return res
        .status(403)
        .json({ message: "Not eligible (institute mismatch)" });
    }

    // 3) spend 1 credit from verifier's matching bucket (only if available > 0)
    const spent = await User.findOneAndUpdate(
      {
        _id: verifierId,
        "verifyCredits.education": {
          $elemMatch: { instituteKey, available: { $gt: 0 } },
        },
      },
      {
        $inc: {
          "verifyCredits.education.$.available": -1,
          "verifyCredits.education.$.used": 1,
        },
      },
      { new: false }
    ).lean();

    if (!spent) {
      return res
        .status(403)
        .json({ message: "No credits left for this institute" });
    }

    // 4) add verification to target row (ObjectId-safe) — USE $elemMatch to bind conditions to SAME array element
    const oid = new mongoose.Types.ObjectId(verifierId);
    const eduOid = new mongoose.Types.ObjectId(eduId);

    const upd = await Profile.updateOne(
      {
        user: targetUserId,
        // 👇 both _id and verifiedBy check must apply to the SAME array element
        education: { $elemMatch: { _id: eduOid, verifiedBy: { $nin: [oid] } } },
      },
      {
        $addToSet: { "education.$.verifiedBy": oid },
        $inc: { "education.$.verifyCount": 1 },
      }
    );

    if (upd.modifiedCount === 0) {
      // refund the spend
      await User.updateOne(
        {
          _id: verifierId,
          "verifyCredits.education": { $elemMatch: { instituteKey } },
        },
        {
          $inc: {
            "verifyCredits.education.$.available": 1,
            "verifyCredits.education.$.used": -1,
          },
        }
      );

      // diagnose: already verified vs bad pair
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
          ? "Already verified this user’s education"
          : "Row changed or invalid eduId for the selected user",
      });
    }

    // 5) reward +1 available to target's same-institute bucket (and +1 total if you persist total)
    const rewardInc = await User.updateOne(
      {
        _id: targetUserId,
        "verifyCredits.education.instituteKey": instituteKey,
      },
      {
        $inc: {
          "verifyCredits.education.$.available": 1,
          "verifyCredits.education.$.total": 1, // remove this if you DON'T store `total` in DB
        },
      }
    );

    if (rewardInc.modifiedCount === 0) {
      await User.updateOne(
        { _id: targetUserId },
        {
          $push: {
            "verifyCredits.education": {
              institute,
              instituteKey,
              available: 1,
              used: 0,
              total: 1, // remove this if you DON'T store `total` in DB
            },
          },
        }
      );
    }

    // 6) return fresh, summarized credits + target edu verify counts
    const [verifierUser, targetUser, refreshedTargetProfile] = await Promise.all([
      User.findById(verifierId).select("verifyCredits.education").lean(),
      User.findById(targetUserId).select("verifyCredits.education").lean(),
      Profile.findOne({ user: targetUserId }).select("education").lean(),
    ]);

    const withComputedTotals = (u) => {
      const buckets = (u?.verifyCredits?.education || []).map((b) => ({
        institute: b.institute,
        instituteKey: b.instituteKey,
        available: b.available || 0,
        used: b.used || 0,
        total:
          typeof b.total === "number" ? b.total : (b.available || 0) + (b.used || 0),
      }));
      const totals = buckets.reduce(
        (acc, b) => {
          acc.available += b.available;
          acc.used += b.used;
          acc.total += b.total;
          return acc;
        },
        { available: 0, used: 0, total: 0 }
      );
      return { buckets, totals };
    };

    return res.status(200).json({
      message: "Education verified",
      verifier: withComputedTotals(verifierUser),
      target: withComputedTotals(targetUser),
      education: (refreshedTargetProfile?.education || []).map((r) => ({
        _id: r._id,
        institute: r.institute,
        verifyCount: r.verifyCount || 0,
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

    // sanitize ids
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

    // 2) eligibility: verifier must also have same-company row on their profile
    const verifierProfile = await Profile.findOne({ user: verifierId }).lean();
    const eligible =
      Array.isArray(verifierProfile?.experience) &&
      verifierProfile.experience.some(
        (e) => (e.companyKey || normalizeCompany(e.company)) === companyKey
      );
    if (!eligible) {
      return res
        .status(403)
        .json({ message: "Not eligible (company mismatch)" });
    }

    // 3) spend 1 credit from verifier's matching company bucket
    const spent = await User.findOneAndUpdate(
      {
        _id: verifierId,
        "verifyCredits.experience": {
          $elemMatch: { companyKey, available: { $gt: 0 } },
        },
      },
      {
        $inc: {
          "verifyCredits.experience.$.available": -1,
          "verifyCredits.experience.$.used": 1,
        },
      },
      { new: false }
    ).lean();

    if (!spent) {
      return res
        .status(403)
        .json({ message: "No credits left for this company" });
    }

    // 4) add verification to target row (ObjectId-safe) — bind conditions to SAME array element
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
      }
    );

    if (upd.modifiedCount === 0) {
      // refund the spend
      await User.updateOne(
        {
          _id: verifierId,
          "verifyCredits.experience": { $elemMatch: { companyKey } },
        },
        {
          $inc: {
            "verifyCredits.experience.$.available": 1,
            "verifyCredits.experience.$.used": -1,
          },
        }
      );

      // diagnose: already verified vs bad pair
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
          ? "Already verified this user’s experience"
          : "Row changed or invalid expId for the selected user",
      });
    }

    // 5) reward target's same-company bucket (+1 available, +1 total if you persist total)
    const rewardInc = await User.updateOne(
      {
        _id: targetUserId,
        "verifyCredits.experience.companyKey": companyKey,
      },
      {
        $inc: {
          "verifyCredits.experience.$.available": 1,
          "verifyCredits.experience.$.total": 1, // remove if you DON'T store total
        },
      }
    );

    if (rewardInc.modifiedCount === 0) {
      await User.updateOne(
        { _id: targetUserId },
        {
          $push: {
            "verifyCredits.experience": {
              company,
              companyKey,
              available: 1,
              used: 0,
              total: 1, // remove if you DON'T store total
            },
          },
        }
      );
    }

    // 6) return fresh, summarized credits + target exp verify counts
    const [verifierUser, targetUser, refreshedTargetProfile] = await Promise.all([
      User.findById(verifierId).select("verifyCredits.experience").lean(),
      User.findById(targetUserId).select("verifyCredits.experience").lean(),
      Profile.findOne({ user: targetUserId }).select("experience").lean(),
    ]);

    const withComputedTotals = (u) => {
      const buckets = (u?.verifyCredits?.experience || []).map((b) => ({
        company: b.company,
        companyKey: b.companyKey,
        available: b.available || 0,
        used: b.used || 0,
        total:
          typeof b.total === "number" ? b.total : (b.available || 0) + (b.used || 0),
      }));
      const totals = buckets.reduce(
        (acc, b) => {
          acc.available += b.available;
          acc.used += b.used;
          acc.total += b.total;
          return acc;
        },
        { available: 0, used: 0, total: 0 }
      );
      return { buckets, totals };
    };

    return res.status(200).json({
      message: "Experience verified",
      verifier: withComputedTotals(verifierUser),
      target: withComputedTotals(targetUser),
      experience: (refreshedTargetProfile?.experience || []).map((r) => ({
        _id: r._id,
        company: r.company,
        verifyCount: r.verifyCount || 0,
      })),
    });
  } catch (err) {
    console.error("verifyExperience error:", err);
    return res.status(500).json({ message: "Failed to verify experience" });
  }
};

