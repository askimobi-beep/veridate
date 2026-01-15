// utils/fileCleanup.js
const fs = require("fs");
const path = require("path");

const FOLDERS = {
  resume: path.join("uploads", "resumes"),
  profilePic: path.join("uploads", "profile"),
  audioProfile: path.join("uploads", "audio"),
  videoProfile: path.join("uploads", "video"),
  educationFiles: path.join("uploads", "education"),
  experienceFiles: path.join("uploads", "experience"),
};

function deleteIfExists(absPath) {
  try {
    if (absPath && fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (e) {
    // swallow (don’t crash API because of fs issues)
    console.error("deleteIfExists failed:", absPath, e.message);
  }
}

function removeOldPersonalFile(kind, filename) {
  if (!filename) return;
  const base =
    kind === "resume" ? FOLDERS.resume :
    kind === "profilePic" ? FOLDERS.profilePic :
    kind === "audioProfile" ? FOLDERS.audioProfile :
    kind === "videoProfile" ? FOLDERS.videoProfile :
    null;
  if (!base) return;
  deleteIfExists(path.join(base, filename));
}

function removeOldEducationFile(filename) {
  if (!filename) return;
  deleteIfExists(path.join(FOLDERS.educationFiles, filename));
}

function removeOldExperienceFile(filename) {
  if (!filename) return;
  deleteIfExists(path.join(FOLDERS.experienceFiles, filename));
}

module.exports = {
  removeOldPersonalFile,
  removeOldEducationFile,
  removeOldExperienceFile,
};
