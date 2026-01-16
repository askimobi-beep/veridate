const Users = require("../models/auth.model");
const Profile = require("../models/Profile");
const { removeOldPersonalFile } = require("../utils/fileCleanup");

// Get all users
exports.GetAllUsers = async (req, res) => {
  try {
    const users = await Users.find().select(
      "-password -resetPasswordToken -resetPasswordExpires -otp -otpExpiry"
    ).lean(); // fetch all users without sensitive fields
    const userIds = users.map((u) => u._id).filter(Boolean);
    let pendingMap = new Map();
    if (userIds.length) {
      const pendingProfiles = await Profile.find({
        user: { $in: userIds },
        profilePicPending: { $exists: true, $ne: "" },
      })
        .select("user profilePicPending")
        .lean();
      pendingMap = new Map(
        pendingProfiles.map((p) => [String(p.user), p.profilePicPending])
      );
    }
    const data = users.map((u) => ({
      ...u,
      profilePicPending: pendingMap.get(String(u._id)) || "",
    }));
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

// Admin: update any user's info
exports.UpdateUser = async (req, res) => {
  try {
    const { id } = req.params; // user ID from URL
    const updateData = req.body;

    // don’t allow updating _id or password directly here
    delete updateData._id;
    delete updateData.password;

    const updatedUser = await Users.findByIdAndUpdate(id, updateData, {
      new: true, // return updated doc
      runValidators: true, // run schema validators
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("UpdateUser error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: err.message,
    });
  }
};

// Admin: get profile photo status for a user
exports.GetProfilePhotoStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const profile = await Profile.findOne({ user: userId })
      .select("profilePic profilePicPending")
      .lean();

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        profilePic: profile.profilePic || "",
        profilePicPending: profile.profilePicPending || "",
      },
    });
  } catch (err) {
    console.error("GetProfilePhotoStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile photo status",
      error: err.message,
    });
  }
};

// Admin: approve pending profile photo
exports.ApproveProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    if (!profile.profilePicPending) {
      return res
        .status(400)
        .json({ success: false, message: "No pending profile photo" });
    }

    const previous = profile.profilePic;
    const pending = profile.profilePicPending;
    profile.profilePic = pending;
    profile.profilePicPending = null;
    await profile.save();

    if (previous) {
      try {
        removeOldPersonalFile("profilePic", previous);
      } catch (e) {
        console.warn(
          "Failed to remove old approved profile photo:",
          e?.message || e
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo approved",
      data: {
        profilePic: profile.profilePic || "",
        profilePicPending: "",
      },
    });
  } catch (err) {
    console.error("ApproveProfilePhoto error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to approve profile photo",
      error: err.message,
    });
  }
};

// Admin: reject pending profile photo
exports.RejectProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    if (!profile.profilePicPending) {
      return res
        .status(400)
        .json({ success: false, message: "No pending profile photo" });
    }

    const pending = profile.profilePicPending;
    profile.profilePicPending = null;
    await profile.save();

    try {
      removeOldPersonalFile("profilePic", pending);
    } catch (e) {
      console.warn(
        "Failed to remove rejected profile photo:",
        e?.message || e
      );
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo rejected",
    });
  } catch (err) {
    console.error("RejectProfilePhoto error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reject profile photo",
      error: err.message,
    });
  }
};
