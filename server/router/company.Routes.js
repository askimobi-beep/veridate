const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const { protect } = require("../middlewares/authMiddleware");
const {
  createCompany,
  listMyCompanies,
  listApprovedCompanies,
  getCompanyPublic,
  createJobPost,
  listJobPosts,
  createInvite,
  getInvitePreview,
  acceptInvite,
  declineInvite,
  listMembers,
  updateMemberRole,
  removeMember,
} = require("../controllers/company.Controller");

const router = express.Router();

router.post("/", protect, upload.array("companyDocs", 5), createCompany);
router.get("/mine", protect, listMyCompanies);
router.get("/approved", protect, listApprovedCompanies);
router.get("/invite/:token", getInvitePreview);
router.post("/invite/:token/accept", protect, acceptInvite);
router.post("/invite/:token/decline", protect, declineInvite);
router.get("/:id", protect, getCompanyPublic);
router.post("/:companyId/invites", protect, createInvite);
router.get("/:companyId/members", protect, listMembers);
router.patch("/:companyId/members/:memberId", protect, updateMemberRole);
router.delete("/:companyId/members/:memberId", protect, removeMember);
router.post("/:companyId/jobs", protect, createJobPost);
router.get("/:companyId/jobs", protect, listJobPosts);

module.exports = router;
