const mongoose = require("mongoose");

const FeedPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentType: {
      type: String,
      enum: [
        "job_update",
        "certification",
        "project",
        "degree",
        "conference",
        "photo",
      ],
      required: true,
    },
    text: {
      type: String,
      maxlength: 2000,
      default: "",
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["image", "video", ""],
      default: "",
    },
  },
  { timestamps: true }
);

FeedPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FeedPost", FeedPostSchema);
