const FeedPost      = require("../models/FeedPost");
const Profile       = require("../models/Profile");
const Notification  = require("../models/Notification");
const User          = require("../models/auth.model");

const ALLOWED_TYPES = [
  "job_update",
  "certification",
  "project",
  "degree",
  "conference",
  "photo",
];

/* Attach profilePic from Profile collection to populated posts */
async function attachProfilePics(posts) {
  const userIds = [...new Set(posts.map((p) => String(p.user?._id || p.user)))];
  const profiles = await Profile.find({ user: { $in: userIds } })
    .select("user profilePic")
    .lean();
  const picMap = {};
  profiles.forEach((pr) => { picMap[String(pr.user)] = pr.profilePic || ""; });
  return posts.map((p) => {
    const uid = String(p.user?._id || p.user);
    return { ...p, user: { ...(p.user || {}), profilePic: picMap[uid] || "" } };
  });
}

exports.createPost = async (req, res) => {
  try {
    const { contentType, text } = req.body || {};

    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ message: "A valid content type is required." });
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

    const populated = await FeedPost.findById(post._id)
      .populate("user", "firstName lastName email")
      .lean();

    const [withPic] = await attachProfilePics([populated]);
    return res.status(201).json({ message: "Post created.", data: withPic });
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(500).json({ message: "Failed to create post." });
  }
};

exports.listFeed = async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      FeedPost.find()
        .populate("user", "firstName lastName email")
        .populate("comments.user", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeedPost.countDocuments(),
    ]);

    const withPics = await attachProfilePics(data);
    return res.json({ data: withPics, total, page, limit });
  } catch (err) {
    console.error("listFeed error:", err);
    return res.status(500).json({ message: "Failed to load feed." });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (String(post.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only edit your own posts." });
    }

    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Post text is required." });

    post.text = text.slice(0, 2000);
    await post.save();

    const populated = await FeedPost.findById(post._id)
      .populate("user", "firstName lastName email")
      .populate("comments.user", "firstName lastName email")
      .lean();

    const [withPic] = await attachProfilePics([populated]);
    return res.json({ message: "Post updated.", data: withPic });
  } catch (err) {
    console.error("updatePost error:", err);
    return res.status(500).json({ message: "Failed to update post." });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const uid = String(req.user.id);
    const idx = post.likes.findIndex((l) => String(l) === uid);
    const isLiking = idx === -1;

    if (isLiking) {
      post.likes.push(uid);
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();

    // Notify post owner (not if they liked their own post)
    if (isLiking && String(post.user) !== uid) {
      const liker = await User.findById(uid).select("firstName lastName").lean();
      const likerName = [liker?.firstName, liker?.lastName].filter(Boolean).join(" ").trim() || "Someone";
      await Notification.create({
        userId: post.user,
        type: "post_like",
        message: `${likerName} liked your post.`,
        metadata: { fromUserId: uid, postId: String(post._id) },
      });
    }

    return res.json({ likes: post.likes, likeCount: post.likes.length });
  } catch (err) {
    console.error("toggleLike error:", err);
    return res.status(500).json({ message: "Failed to toggle like." });
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required." });

    post.comments.push({ user: req.user.id, text: text.slice(0, 1000) });
    await post.save();

    const populated = await FeedPost.findById(post._id)
      .populate("comments.user", "firstName lastName email")
      .lean();

    // Attach profilePics to comment users
    const commentUserIds = [...new Set(populated.comments.map((c) => String(c.user?._id || c.user)))];
    const profiles = await Profile.find({ user: { $in: commentUserIds } })
      .select("user profilePic")
      .lean();
    const picMap = {};
    profiles.forEach((pr) => { picMap[String(pr.user)] = pr.profilePic || ""; });

    const comments = populated.comments.map((c) => ({
      ...c,
      user: { ...(c.user || {}), profilePic: picMap[String(c.user?._id || c.user)] || "" },
    }));

    // Notify post owner (not if they comment on their own post)
    if (String(post.user) !== String(req.user.id)) {
      const commenter = await User.findById(req.user.id).select("firstName lastName").lean();
      const commenterName = [commenter?.firstName, commenter?.lastName].filter(Boolean).join(" ").trim() || "Someone";
      await Notification.create({
        userId: post.user,
        type: "post_comment",
        message: `${commenterName} commented on your post.`,
        metadata: { fromUserId: String(req.user.id), postId: String(post._id) },
      });
    }

    return res.json({ message: "Comment added.", comments });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ message: "Failed to add comment." });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (String(post.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }

    await post.deleteOne();
    return res.json({ message: "Post deleted." });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(500).json({ message: "Failed to delete post." });
  }
};
