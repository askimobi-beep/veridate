// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure folders exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "";
    if (file.fieldname === "resume") {
      folder = "uploads/resumes";
    } else if (file.fieldname === "profilePic") {
      folder = "uploads/profile";
    } else if (file.fieldname === "audioProfile") {
      folder = "uploads/audio";
    } else if (file.fieldname === "videoProfile") {
      folder = "uploads/video";
    // CHANGED: support bracketed names like educationFiles[0]
    } else if (file.fieldname === "educationFiles" || file.fieldname.startsWith("educationFiles[")) {
      folder = "uploads/education";
    // CHANGED: support bracketed names like experienceFiles[0]
    } else if (file.fieldname === "experienceFiles" || file.fieldname.startsWith("experienceFiles[")) {
      folder = "uploads/experience";
    } else {
      folder = "uploads/others";
    }
    ensureDir(folder);
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const sanitizedField = file.fieldname.replace(/\s+/g, "-").toLowerCase();
    const name = `${sanitizedField}-${timestamp}${ext}`;
    cb(null, name);
  },
});

// Optional: File type filtering
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "audio/mpeg",
    "audio/mp4",
    "audio/webm",
    "audio/wav",
    "audio/ogg",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
  ];

  if (
    allowedTypes.includes(file.mimetype) ||
    file.mimetype.startsWith("audio/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

// Final upload middleware (50MB limit)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

module.exports = upload;
