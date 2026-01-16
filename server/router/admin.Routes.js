const express = require("express");
const {
  GetAllUsers,
  UpdateUser,
  GetProfilePhotoStatus,
  ApproveProfilePhoto,
  RejectProfilePhoto,
} = require("../controllers/admin.Controller");
const {
  createOrganization,
  listOrganizationsAdmin,
} = require("../controllers/organization.Controller");
const { isAdmin, protect } = require("../middlewares/authMiddleware");



const router = express.Router();

// ✅ protect must run before isAdmin
router.get("/get-allusers", protect, isAdmin, GetAllUsers);
router.put("/update-user/:id", protect, isAdmin, UpdateUser);
router.get("/profile-photo/:userId", protect, isAdmin, GetProfilePhotoStatus);
router.post("/profile-photo/:userId/approve", protect, isAdmin, ApproveProfilePhoto);
router.post("/profile-photo/:userId/reject", protect, isAdmin, RejectProfilePhoto);
router.post("/organizations", protect, isAdmin, createOrganization);
router.get("/organizations", protect, isAdmin, listOrganizationsAdmin);



module.exports = router;
