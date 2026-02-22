const FeedPost = require("../models/FeedPost");

const ALLOWED_TYPES = [
  "job_update",
  "certification",
  "project",
  "degree",
  "conference",
  "photo",
];

exports.createPost = async (req, res) => {
  try {
    const { contentType, text } = req.body || {};

    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return res
        .status(400)
        .json({ message: "A valid content type is required." });
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Post text is required." });
    }

    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      mediaUrl = req.file.filename;
      const mime = String(req.file.mimetype || "");
      if (mime.startsWith("image/")) mediaType = "image";
      else if (mime.startsWith("video/")) mediaType = "video";
    }

    const post = await FeedPost.create({
      user: req.user.id,
      contentType,
      text: String(text).trim().slice(0, 2000),
      mediaUrl,
      mediaType,
    });

    // Populate user info before returning
    const populated = await FeedPost.findById(post._id)
      .populate("user", "firstName lastName email profilePic")
      .lean();

    return res.status(201).json({ message: "Post created.", data: populated });
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(500).json({ message: "Failed to create post." });
  }
};

exports.listFeed = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      FeedPost.find()
        .populate("user", "firstName lastName email profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeedPost.countDocuments(),
    ]);

    return res.json({ data, total, page, limit });
  } catch (err) {
    console.error("listFeed error:", err);
    return res.status(500).json({ message: "Failed to load feed." });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (String(post.user) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts." });
    }

    await post.deleteOne();
    return res.json({ message: "Post deleted." });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(500).json({ message: "Failed to delete post." });
  }
};
