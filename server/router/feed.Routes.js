const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const { protect } = require("../middlewares/authMiddleware");
const {
  createPost,
  listFeed,
  updatePost,
  toggleLike,
  addComment,
  deletePost,
} = require("../controllers/feed.Controller");

const router = express.Router();

router.get("/", protect, listFeed);
router.post("/", protect, upload.single("media"), createPost);
router.patch("/:id", protect, updatePost);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.delete("/:id", protect, deletePost);

module.exports = router;
