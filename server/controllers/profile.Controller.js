// controllers/profile.Controller.js
const Profile = require("../models/Profile");
const User = require("../models/auth.model");
const mongoose = require("mongoose");
const {
  Types: { ObjectId },
} = mongoose;
const {
  removeOldPersonalFile,
  removeOldEducationFile,
  removeOldExperienceFile,
} = require("../utils/fileCleanup");
const { normalizeInstitute } = require("../utils/normalize");

// --- Personal privacy keys ---
const PERSONAL_PRIVACY_KEYS = new Set([
  "maritalStatus",
  "cnic",
  "fatherName",
  "dob",
  "mobile",
  "email",
]);

const makeFileUrl = (req, folder, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`;
};

function redactPersonalFields(profileDoc) {
  if (!profileDoc) return profileDoc;
  const p =
    typeof profileDoc.toObject === "function"
      ? profileDoc.toObject()
      : { ...profileDoc };
  const hidden = new Set(p.personalHiddenFields || []);
  for (const key of PERSONAL_PRIVACY_KEYS) {
    if (hidden.has(key)) delete p[key];
  }
  return p;
}

// redact per-row based on hiddenFields
function redactEduExpArrays(p) {
  if (!p) return p;

  if (Array.isArray(p.education)) {
    p.education = p.education.map((row) => {
      const r = { ...row };
      const hidden = new Set(r.hiddenFields || []);
      if (hidden.has("degreeFile")) delete r.degreeFile; // hide file
      if (hidden.has("degreeTitle")) delete r.degreeTitle; // optional support
      return r;
    });
  }

  if (Array.isArray(p.experience)) {
    p.experience = p.experience.map((row) => {
      const r = { ...row };
      const hidden = new Set(r.hiddenFields || []);
      if (hidden.has("experienceLetterFile")) delete r.experienceLetterFile;
      return r;
    });
  }

  return p;
}


const normalizeDigits = (s) => (s || "").replace(/\D+/g, ""); // keep only 0-9
const normalizeCode = (s) => {
  const t = (s || "").trim();
  if (!t) return "";
  const digits = t.replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
};



/* =========================
   SAVE PERSONAL INFO
   ========================= */
// exports.savePersonalInfo = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const profile = await Profile.findOne({ user: userId });

//     const ALLOWED_WHEN_LOCKED = new Set([
//       "email",
//       "mobile",
//       "maritalStatus",
//       "city",
//       "country",
//       "residentStatus",
//       "nationality",
//       "shiftPreferences",
//       "workAuthorization",
//       "personalHiddenFields",
//     ]);

//     const filesUpdate = {};
//     if (req.files?.resume?.[0])
//       filesUpdate.resume = req.files.resume[0].filename;
//     if (req.files?.profilePic?.[0])
//       filesUpdate.profilePic = req.files.profilePic[0].filename;

//     const fields = [
//       "name",
//       "email",
//       "fatherName",
//       "mobile",
//       "cnic",
//       "city",
//       "country",
//       "gender",
//       "maritalStatus",
//       "residentStatus",
//       "nationality",
//       "dob",
//       "shiftPreferences",
//       "workAuthorization",
//       "personalHiddenFields",
//     ];

//     const bodyUpdate = {};
//     for (const key of fields) {
//       if (req.body[key] !== undefined) {
//         if (
//           key === "shiftPreferences" ||
//           key === "workAuthorization" ||
//           key === "personalHiddenFields"
//         ) {
//           try {
//             bodyUpdate[key] = Array.isArray(req.body[key])
//               ? req.body[key]
//               : JSON.parse(req.body[key] || "[]");
//           } catch {
//             bodyUpdate[key] = [];
//           }
//         } else {
//           bodyUpdate[key] = req.body[key];
//         }
//       }
//     }

//     if (profile) {
//       if (filesUpdate.resume && profile.resume)
//         removeOldPersonalFile("resume", profile.resume);
//       if (filesUpdate.profilePic && profile.profilePic)
//         removeOldPersonalFile("profilePic", profile.profilePic);
//     }

//     if (!profile?.personalInfoLocked) {
//       const updated = await Profile.findOneAndUpdate(
//         { user: userId },
//         { $set: { ...bodyUpdate, ...filesUpdate, personalInfoLocked: true } },
//         { new: true, upsert: true }
//       );
//       return res
//         .status(200)
//         .json({ message: "Personal info saved & locked", profile: updated });
//     }

//     const lockedUpdate = {};
//     for (const [k, v] of Object.entries(bodyUpdate)) {
//       if (ALLOWED_WHEN_LOCKED.has(k)) lockedUpdate[k] = v;
//     }
//     Object.assign(lockedUpdate, filesUpdate);

//     if (!Object.keys(lockedUpdate).length) {
//       return res
//         .status(403)
//         .json({
//           error:
//             "This section is locked. Only permitted fields can be updated.",
//         });
//     }

//     const updated = await Profile.findOneAndUpdate(
//       { user: userId },
//       { $set: lockedUpdate },
//       { new: true }
//     );
//     return res
//       .status(200)
//       .json({ message: "Personal info updated", profile: updated });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to save personal info" });
//   }
// };

// add next to savePersonalInfo


exports.savePersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId });

    // fields allowed to update when section is locked
    const ALLOWED_WHEN_LOCKED = new Set([
      "email",
      "mobile",
      "mobileCountryCode", // 👈 allow code to come through when locked
      "maritalStatus",
      "city",
      "country",
      "residentStatus",
      "nationality",
      "shiftPreferences",
      "workAuthorization",
      "personalHiddenFields",
    ]);

    // file payloads (unchanged)
    const filesUpdate = {};
    if (req.files?.resume?.[0]) filesUpdate.resume = req.files.resume[0].filename;
    if (req.files?.profilePic?.[0]) filesUpdate.profilePic = req.files.profilePic[0].filename;

    // read body fields (now includes mobileCountryCode)
    const fields = [
      "name",
      "email",
      "fatherName",
      "mobile",
      "mobileCountryCode", // 👈 NEW
      "cnic",
      "city",
      "country",
      "gender",
      "maritalStatus",
      "residentStatus",
      "nationality",
      "dob",
      "shiftPreferences",
      "workAuthorization",
      "personalHiddenFields",
    ];

    const bodyUpdate = {};
    for (const key of fields) {
      if (req.body[key] !== undefined) {
        if (key === "shiftPreferences" || key === "workAuthorization" || key === "personalHiddenFields") {
          try {
            bodyUpdate[key] = Array.isArray(req.body[key])
              ? req.body[key]
              : JSON.parse(req.body[key] || "[]");
          } catch {
            bodyUpdate[key] = [];
          }
        } else {
          bodyUpdate[key] = req.body[key];
        }
      }
    }

    // 👇 merge country code + local number into a single mobile string
    // example: code "+92" and number "3001234567" -> "+923001234567"
    {
      const code = normalizeCode(bodyUpdate.mobileCountryCode || req.body.mobileCountryCode);
      const num = normalizeDigits(bodyUpdate.mobile || req.body.mobile);

      if (num) {
        bodyUpdate.mobile = code ? `${code}${num}` : num;
      }

      // if you DON'T want to store mobileCountryCode separately in the DB:
      delete bodyUpdate.mobileCountryCode;
    }

    // cleanup old files if replacing
    if (profile) {
      if (filesUpdate.resume && profile.resume) removeOldPersonalFile?.("resume", profile.resume);
      if (filesUpdate.profilePic && profile.profilePic) removeOldPersonalFile?.("profilePic", profile.profilePic);
    }

    // if section not locked yet → set + lock
    if (!profile?.personalInfoLocked) {
      const updated = await Profile.findOneAndUpdate(
        { user: userId },
        { $set: { ...bodyUpdate, ...filesUpdate, personalInfoLocked: true } },
        { new: true, upsert: true }
      );
      return res.status(200).json({ message: "Personal info saved & locked", profile: updated });
    }

    // section locked → only allow selected fields
    const lockedUpdate = {};
    for (const [k, v] of Object.entries(bodyUpdate)) {
      if (ALLOWED_WHEN_LOCKED.has(k)) lockedUpdate[k] = v;
    }
    Object.assign(lockedUpdate, filesUpdate);

    if (!Object.keys(lockedUpdate).length) {
      return res
        .status(403)
        .json({ error: "This section is locked. Only permitted fields can be updated." });
    }

    const updated = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: lockedUpdate },
      { new: true }
    );

    return res.status(200).json({ message: "Personal info updated", profile: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save personal info" });
  }
};


exports.saveProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId });

    // two supported flows:
    // 1) upload a new image via multipart (req.file)
    // 2) clear existing image by sending profilePic="" (FormData text field)
    const isClearIntent =
      typeof req.body.profilePic !== "undefined" && req.body.profilePic === "";

    if (!req.file && !isClearIntent) {
      return res
        .status(400)
        .json({ error: "No photo uploaded or clear intent provided" });
    }

    // compute next value
    const nextPhoto = isClearIntent ? null : req.file?.filename;

    // cleanup: if replacing/removing and old photo exists, remove it
    if (profile && profile.profilePic && (nextPhoto || isClearIntent)) {
      try {
        removeOldPersonalFile("profilePic", profile.profilePic);
      } catch (e) {
        // don’t block user on cleanup issues
        console.warn("Failed to remove old profile photo:", e?.message || e);
      }
    }

    // IMPORTANT: do NOT touch personalInfoLocked here
    const updated = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: { profilePic: nextPhoto } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: isClearIntent
        ? "Profile photo removed"
        : "Profile photo updated",
      profile: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save profile photo" });
  }
};


async function ensureUserEduCredits(userId, eduRows) {
  const institutes = (eduRows || [])
    .map(r => ({
      institute: r.institute || "",
      instituteKey: normalizeInstitute(r.institute || ""),
    }))
    .filter(r => r.instituteKey);

  if (!institutes.length) return;

  const user = await User.findById(userId).lean();
  if (!user) return;

  const existing = new Set(
    (user.verifyCredits?.education || []).map(b => b.instituteKey)
  );

  const toAdd = [];
  for (const r of institutes) {
    if (!existing.has(r.instituteKey)) {
      toAdd.push({
        institute: r.institute,
        instituteKey: r.instituteKey,
        available: 1,
        used: 0,
      });
      existing.add(r.instituteKey);
    }
  }

  if (toAdd.length) {
    await User.updateOne(
      { _id: userId },
      { $push: { "verifyCredits.education": { $each: toAdd } } }
    );
  }
}

/* =========================
   SAVE EDUCATION (allows hiddenFields when locked)
   ========================= */
exports.saveEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId });

    const ALLOWED_WHEN_LOCKED = new Set([
      "degreeTitle",
      "endDate",
      "instituteWebsite",
      "degreeFile",
      "hiddenFields",
    ]);

    // parse rows
    let incoming = [];
    try {
      incoming = JSON.parse(req.body.education || "[]");
      if (!Array.isArray(incoming)) incoming = [];
    } catch {
      incoming = [];
    }

    // ================================
    // CHANGED: Gather files whether router used .any() or .fields()
    // ================================
    const allIncomingFiles = Array.isArray(req.files)
      ? req.files // from upload.any()
      : req.files?.educationFiles ?? []; // from upload.fields()

    const degreeFiles = (
      Array.isArray(allIncomingFiles) ? allIncomingFiles : [allIncomingFiles]
    ).filter(
      (f) =>
        f &&
        typeof f.fieldname === "string" &&
        f.fieldname.startsWith("educationFiles")
    );

    // First: exact mapping by bracketed index: educationFiles[<idx>]
    degreeFiles.forEach((f) => {
      if (!f?.filename || typeof f.fieldname !== "string") return;
      const m = f.fieldname.match(/\[(\d+)\]/);
      const parsedIdx = m ? parseInt(m[1], 10) : NaN;
      if (!Number.isNaN(parsedIdx) && incoming[parsedIdx]) {
        incoming[parsedIdx].degreeFile = f.filename; // precise row
      }
    });

    // Second: legacy fallback — if any files came without brackets, match by sequence
    let seq = 0;
    degreeFiles
      .filter((f) => !/\[\d+\]/.test(f.fieldname))
      .forEach((f) => {
        while (seq < incoming.length && incoming[seq]?.degreeFile) seq++;
        if (seq < incoming.length) {
          incoming[seq].degreeFile = f.filename;
          seq++;
        }
      });

    // first save locks the section
    if (!profile?.educationLocked) {
      if (Array.isArray(profile?.education)) {
        for (const row of profile.education) {
          if (row?.degreeFile) removeOldEducationFile(row.degreeFile);
        }
      }

      const cleaned = incoming.map((e) => ({
        degreeTitle: e?.degreeTitle || "",
        startDate: e?.startDate || "",
        endDate: e?.endDate || "",
        institute: e?.institute || "",
        instituteWebsite: e?.instituteWebsite || "",
        degreeFile: e?.degreeFile || null,
        hiddenFields: Array.isArray(e?.hiddenFields) ? e.hiddenFields : [],
      }));

      const updated = await Profile.findOneAndUpdate(
        { user: userId },
        { $set: { education: cleaned, educationLocked: true } },
        { new: true, upsert: true }
      );

      await ensureUserEduCredits(userId, updated.education);

      return res
        .status(200)
        .json({ message: "Education saved & locked", profile: updated });
    }

    // patch existing + append new
    const current = Array.isArray(profile.education) ? profile.education : [];
    const patched = current.map((r) => ({ ...(r.toObject?.() ?? r) }));
    const byId = new Map(
      patched
        .map((r, idx) => (r?._id ? [String(r._id), idx] : null))
        .filter(Boolean)
    );

    for (let i = 0; i < incoming.length; i++) {
      const inc = incoming[i] || {};
      let targetIdx = -1;

      if (inc._id && byId.has(String(inc._id))) {
        targetIdx = byId.get(String(inc._id));
      } else if (i < patched.length && !patched[i]?._id) {
        targetIdx = i;
      }

      if (targetIdx >= 0) {
        const prev = patched[targetIdx];
        const next = { ...prev };

        for (const [k, v] of Object.entries(inc)) {
          if (!ALLOWED_WHEN_LOCKED.has(k)) continue;

          if (k === "degreeFile" && v && v !== prev.degreeFile) {
            if (prev.degreeFile) removeOldEducationFile(prev.degreeFile);
          }

          if (k === "hiddenFields") {
            next.hiddenFields = Array.isArray(v) ? v : [];
          } else {
            next[k] = v ?? next[k];
          }
        }
        patched[targetIdx] = next;
      } else {
        patched.push({
          degreeTitle: inc?.degreeTitle || "",
          startDate: inc?.startDate || "",
          endDate: inc?.endDate || "",
          institute: inc?.institute || "",
          instituteWebsite: inc?.instituteWebsite || "",
          degreeFile: inc?.degreeFile || null,
          hiddenFields: Array.isArray(inc?.hiddenFields)
            ? inc.hiddenFields
            : [],
        });
      }
    }

    const updated = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: { education: patched } },
      { new: true }
    );

    await ensureUserEduCredits(userId, updated.education);

    return res
      .status(200)
      .json({
        message: "Education updated (existing rows locked; new rows added)",
        profile: updated,
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save education" });
  }
};


async function ensureUserExpCredits(userId, expRows) {
  const companies = (expRows || [])
    .map((r) => ({
      company: r.company || "",
      companyKey: r.companyKey || normalizeInstitute(r.company || ""),
    }))
    .filter((r) => r.companyKey);

  if (!companies.length) return;

  const user = await User.findById(userId).lean();
  if (!user) return;

  const existing = new Set(
    (user.verifyCredits?.experience || []).map((b) => b.companyKey)
  );

  const toAdd = [];
  for (const r of companies) {
    if (!existing.has(r.companyKey)) {
      toAdd.push({
        company: r.company,
        companyKey: r.companyKey,
        available: 1,
        used: 0,
        total: 1, // if you persist total; remove if you decided not to store it
      });
      existing.add(r.companyKey);
    }
  }

  if (toAdd.length) {
    await User.updateOne(
      { _id: userId },
      { $push: { "verifyCredits.experience": { $each: toAdd } } }
    );
  }
}


exports.saveExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId });

    const ALLOWED_WHEN_LOCKED = new Set([
      "endDate",
      "companyWebsite",
      "experienceLetterFile",
      "jobFunctions",
      "hiddenFields",
    ]);

    // parse incoming rows
    let incoming = [];
    try {
      incoming = JSON.parse(req.body.experience || "[]");
      if (!Array.isArray(incoming)) incoming = [];
    } catch {
      incoming = [];
    }

    // gather files (.any() or .fields()) and support experienceFiles[0]
    const allIncomingFiles = Array.isArray(req.files)
      ? req.files
      : req.files?.experienceFiles ?? [];

    const expFiles = (Array.isArray(allIncomingFiles) ? allIncomingFiles : [allIncomingFiles]).filter(
      (f) => f && typeof f.fieldname === "string" && f.fieldname.startsWith("experienceFiles")
    );

    // map bracketed files
    expFiles.forEach((f) => {
      if (!f?.filename || typeof f.fieldname !== "string") return;
      const m = f.fieldname.match(/\[(\d+)\]/);
      const parsedIdx = m ? parseInt(m[1], 10) : NaN;
      if (!Number.isNaN(parsedIdx) && incoming[parsedIdx]) {
        incoming[parsedIdx].experienceLetterFile = f.filename;
      }
    });

    // fallback sequence mapping
    let seq = 0;
    expFiles
      .filter((f) => !/\[\d+\]/.test(f.fieldname))
      .forEach((f) => {
        while (seq < incoming.length && incoming[seq]?.experienceLetterFile) seq++;
        if (seq < incoming.length) {
          incoming[seq].experienceLetterFile = f.filename;
          seq++;
        }
      });

    // FIRST SAVE → lock section
    if (!profile?.experienceLocked) {
      if (Array.isArray(profile?.experience)) {
        for (const row of profile.experience) {
          if (row?.experienceLetterFile) removeOldExperienceFile(row.experienceLetterFile);
        }
      }

      const cleaned = incoming.map((e) => ({
        jobTitle: e?.jobTitle || "",
        startDate: e?.startDate || "",
        endDate: e?.endDate || "",
        company: e?.company || "",
        companyWebsite: e?.companyWebsite || "",
        experienceLetterFile: e?.experienceLetterFile || null,
        jobFunctions: Array.isArray(e?.jobFunctions) ? e.jobFunctions : [],
        industry: e?.industry || "",
        hiddenFields: Array.isArray(e?.hiddenFields) ? e.hiddenFields : [],
        // 👇 add normalized key so verifyExperience can match buckets
        companyKey: normalizeInstitute(e?.company || ""),
      }));

      const updated = await Profile.findOneAndUpdate(
        { user: userId },
        { $set: { experience: cleaned, experienceLocked: true } },
        { new: true, upsert: true }
      );

      // 👇 seed per-company credits on User
      await ensureUserExpCredits(userId, updated.experience);

      return res.status(200).json({ message: "Experience saved & locked", profile: updated });
    }

    // PATCH existing + APPEND new
    const current = Array.isArray(profile.experience) ? profile.experience : [];
    const patched = current.map((r) => ({ ...(r.toObject?.() ?? r) }));

    const byId = new Map(
      patched.map((r) => (r?._id ? [String(r._id), r] : null)).filter(Boolean)
    );

    for (let i = 0; i < incoming.length; i++) {
      const inc = incoming[i] || {};
      let targetIdx = -1;

      if (inc._id && byId.has(String(inc._id))) {
        targetIdx = patched.findIndex((x) => String(x?._id) === String(inc._id));
      } else if (i < patched.length && !patched[i]?._id) {
        targetIdx = i;
      }

      if (targetIdx >= 0) {
        // UPDATE limited fields when locked
        const prev = patched[targetIdx];
        const next = { ...prev };

        for (const [k, v] of Object.entries(inc)) {
          if (!ALLOWED_WHEN_LOCKED.has(k)) continue;

          if (k === "experienceLetterFile" && v && v !== prev.experienceLetterFile) {
            if (prev.experienceLetterFile) removeOldExperienceFile(prev.experienceLetterFile);
          }

          if (k === "hiddenFields") {
            next.hiddenFields = Array.isArray(v) ? v : [];
          } else if (k === "jobFunctions") {
            next.jobFunctions = Array.isArray(v) ? v : [];
          } else {
            next[k] = v ?? next[k];
          }
        }

        // company is NOT editable when locked, so keep existing companyKey
        patched[targetIdx] = next;
      } else {
        // APPEND new row (normalize companyKey)
        patched.push({
          jobTitle: inc?.jobTitle || "",
          startDate: inc?.startDate || "",
          endDate: inc?.endDate || "",
          company: inc?.company || "",
          companyWebsite: inc?.companyWebsite || "",
          experienceLetterFile: inc?.experienceLetterFile || null,
          jobFunctions: Array.isArray(inc?.jobFunctions) ? inc.jobFunctions : [],
          industry: inc?.industry || "",
          hiddenFields: Array.isArray(inc?.hiddenFields) ? inc.hiddenFields : [],
          companyKey: normalizeInstitute(inc?.company || ""),
        });
      }
    }

    const updated = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: { experience: patched } },
      { new: true }
    );

    // 👇 ensure buckets exist for any newly added company rows
    await ensureUserExpCredits(userId, updated.experience);

    return res.status(200).json({
      message: "Experience updated (existing rows locked; new rows added)",
      profile: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save experience" });
  }
};

/* =========================
   PUBLIC DIRECTORY (respects personal + per-row hidden)
   ========================= */
exports.listProfilesPublic = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 12,
      q = "",
      gender,
      country,
      jobTitle,
      industry,
      excludeId,
    } = req.query;

    page = parseInt(page, 10);
    limit = Math.min(50, parseInt(limit, 10) || 12);

    const filter = {};

    if (q) {
      const rx = new RegExp(q.trim(), "i");
      filter.$or = [
        { name: rx },
        { email: rx },
        { mobile: rx },
        { city: rx },
        { country: rx },
      ];
    }
    if (gender) filter.gender = gender;
    if (country) filter.country = country;
    if (jobTitle) filter["experience.jobTitle"] = jobTitle;
    if (industry) filter["experience.industry"] = industry;

    // 🔒 hide my own profile if logged in
    const loggedUserId = req.user?.id || req.user?._id; // depends on your JWT payload
    if (loggedUserId && ObjectId.isValid(loggedUserId)) {
      filter.user = { $ne: new ObjectId(loggedUserId) };
    }

    // optional: also honor ?excludeId=<profileId or userId>
    if (excludeId) {
      // try both: exclude profile _id or user field
      if (!filter.$and) filter.$and = [];
      const or = [];
      if (ObjectId.isValid(excludeId)) {
        or.push({ _id: { $ne: new ObjectId(excludeId) } });
        or.push({ user: { $ne: new ObjectId(excludeId) } });
      } else {
        // non-ObjectId (just in case) -> leave it alone
      }
      if (or.length) filter.$and.push(...or);
    }

    const [rows, total] = await Promise.all([
      Profile.find(filter)
        .select(
          "user name email mobile gender city country profilePic education experience personalHiddenFields"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Profile.countDocuments(filter),
    ]);

    const data = rows.map((p) => {
      const isHidden = (k) =>
        Array.isArray(p.personalHiddenFields) &&
        p.personalHiddenFields.includes(k);

      const pickLatest = (arr, endKey = "endDate", startKey = "startDate") => {
        if (!Array.isArray(arr) || !arr.length) return null;
        const copy = [...arr];
        copy.sort((a, b) => {
          const ad = new Date(a?.[endKey] || a?.[startKey] || 0).getTime();
          const bd = new Date(b?.[endKey] || b?.[startKey] || 0).getTime();
          return bd - ad;
        });
        return copy[0] || null;
      };

      const latestEdu = pickLatest(p.education);
      const latestExp = pickLatest(p.experience);

      const educationCard = latestEdu
        ? {
            degreeTitle:
              Array.isArray(latestEdu.hiddenFields) &&
              latestEdu.hiddenFields.includes("degreeTitle")
                ? ""
                : latestEdu.degreeTitle || "",
          }
        : null;

      return {
        _id: p._id,
        user:
          typeof p.user === "object" && p.user?.toString
            ? p.user.toString()
            : p.user || "",
        name: p.name || "Unnamed",
        email: isHidden("email") ? "" : p.email || "",
        mobile: isHidden("mobile") ? "" : p.mobile || "",
        gender: p.gender || "",
        city: p.city || "",
        country: p.country || "",
        profilePicUrl: makeFileUrl(req, "profile", p.profilePic),
        education: educationCard,
        experience: latestExp
          ? {
              jobTitle: latestExp.jobTitle || "",
              company: latestExp.company || "",
            }
          : null,
      };
    });

    return res.status(200).json({
      page,
      limit,
      total,
      hasMore: page * limit < total,
      data,
    });
  } catch (err) {
    console.error("listProfilesPublic error:", err);
    return res.status(500).json({ error: "Failed to list profiles" });
  }
};

/* =========================
   PUBLIC: GET PROFILE BY USER ID
   ========================= */
exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const profile = await Profile.findOne({ user: userId }).lean();

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const redacted = redactPersonalFields(profile);
    redactEduExpArrays(redacted);
    redacted.profilePicUrl = makeFileUrl(req, "profile", redacted.profilePic);

    return res.status(200).json(redacted);
  } catch (err) {
    console.error("getFullProfileByUserId error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/* =========================
   PRIVATE: GET MY PROFILE
   ========================= */
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: "No profile found" });
    res.status(200).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
