const Users = require("../models/auth.model");

// Get all users
exports.GetAllUsers = async (req, res) => {
  try {
    const users = await Users.find(); // fetch all users
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
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
