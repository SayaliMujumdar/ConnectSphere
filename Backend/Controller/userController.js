const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { getIO, getOnlineUsers } = require("../socket");

// @desc  Get user profile
// GET   /api/users/:username
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("followers", "_id username profilePicture")
      .populate("following", "_id username profilePicture");

    if (!user) return res.status(404).json({ error: "User not found" });

    const postCount = await Post.countDocuments({
      author: user._id,
      visibility: "public",
    });
    res.json({ user, postCount });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get user by ID
// GET   /api/users/id/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -resetPasswordToken -resetPasswordExpires",
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Update profile
// PUT   /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { bio, website, location, username, isPrivate } = req.body;
    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (location !== undefined) updates.location = location;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;

    if (username && username !== req.user.username) {
      const exists = await User.findOne({ username });
      if (exists)
        return res.status(400).json({ error: "Username already taken" });
      updates.username = username;
    }

    if (req.files?.profilePicture) {
      updates.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
    }
    if (req.files?.coverPhoto) {
      updates.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Follow / Unfollow user
// PUT   /api/users/:id/follow
const toggleFollow = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const isFollowing = targetUser.followers.includes(req.user._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.id },
      });
      return res.json({ message: "Unfollowed", following: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.params.id, {
        $addToSet: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: req.params.id },
      });

      // Create notification
      const notification = await Notification.create({
        recipient: req.params.id,
        sender: req.user._id,
        type: "follow",
        text: `${req.user.username} started following you.`,
      });

      // Emit socket notification
      const io = getIO();
      const onlineUsers = getOnlineUsers();
      const recipientSocketId = onlineUsers.get(req.params.id);
      if (recipientSocketId) {
        const populatedNotif = await notification.populate(
          "sender",
          "username profilePicture",
        );
        io.to(recipientSocketId).emit("notification", populatedNotif);
      }

      return res.json({ message: "Followed", following: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get followers
// GET   /api/users/:id/followers
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "_id username profilePicture bio",
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ followers: user.followers });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get following
// GET   /api/users/:id/following
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "_id username profilePicture bio",
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ following: user.following });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get suggested users
// GET   /api/users/suggestions
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const suggestions = await User.find({
      _id: { $ne: req.user._id, $nin: currentUser.following },
    })
      .select("_id username profilePicture bio followers")
      .limit(10);

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getUserProfile,
  getUserById,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getSuggestedUsers,
};
