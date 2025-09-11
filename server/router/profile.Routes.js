const express = require("express");
const router = express.Router();
const {
  // createProfile,
  savePersonalInfo,
  saveEducation,
  getProfile,
  saveExperience,
  listProfilesPublic,
  getProfileByUserId,
  saveProfilePhoto,
} = require("../controllers/profile.Controller");

const upload = require("../middlewares/uploadMiddleware");
const { protect } = require("../middlewares/authMiddleware");
const { softAuth } = require("../middlewares/softAuth");

// router.post(
//   "/create",
//   protect,
//   upload.fields([
//     { name: "resume", maxCount: 1 },
//     { name: "profilePic", maxCount: 1 },
//     { name: "educationFiles", maxCount: 10 },
//   ]),
//   createProfile
// );

router.post(
  "/save-personal-info",
  protect,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
  ]),
  savePersonalInfo
);

router.post(
  "/save-profile-photo",
  protect,
  upload.single("profilePic"), // <— just one file
  saveProfilePhoto
);

router.post(
  "/save-education",
  protect,
  upload.any(), // ✅ ACCEPT ANY FIELD NAMES, we'll filter by prefix server-side
  saveEducation
);

router.post(
  "/save-experience",
  protect,
  upload.any(), // ✅ ACCEPT ANY FIELD NAMES, we'll filter by prefix server-side
  saveExperience
);

router.get("/directory", softAuth, listProfilesPublic);

router.get("/getonid/:userId", getProfileByUserId);
router.get("/me", protect, getProfile);

module.exports = router;
