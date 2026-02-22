const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const { protect } = require("../middlewares/authMiddleware");
const {
  createPost,
  listFeed,
  deletePost,
} = require("../controllers/feed.Controller");

const router = express.Router();

router.get("/", protect, listFeed);
router.post("/", protect, upload.single("media"), createPost);
router.delete("/:id", protect, deletePost);

module.exports = router;
