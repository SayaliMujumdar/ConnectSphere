const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getIO, getOnlineUsers } = require("../socket");

const sendNotif = async (recipientId, senderId, type, postId, text) => {
  if (recipientId.toString() === senderId.toString()) return;
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    post: postId || null,
    text,
  });
  const io = getIO();
  const onlineUsers = getOnlineUsers();
  const socketId = onlineUsers.get(recipientId.toString());
  if (socketId) {
    const populated = await notification.populate(
      "sender",
      "username profilePicture",
    );
    io.to(socketId).emit("notification", populated);
  }
};

// @desc  Create post
// POST  /api/posts
const createPost = async (req, res) => {
  try {
    const { content, visibility } = req.body;
    const media = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const mediaType = file.mimetype.startsWith("video") ? "video" : "image";
        media.push({ url: `/uploads/${file.filename}`, type: mediaType });
      });
    }

    if (!content && media.length === 0) {
      return res.status(400).json({ error: "Post must have content or media" });
    }

    const hashtags =
      (content || "").match(/#\w+/g)?.map((h) => h.toLowerCase()) || [];
    const mentionUsernames =
      (content || "").match(/@\w+/g)?.map((m) => m.slice(1).toLowerCase()) ||
      [];

    let mentions = [];
    if (mentionUsernames.length > 0) {
      const mentionedUsers = await User.find({
        username: { $in: mentionUsernames },
      }).select("_id");
      mentions = mentionedUsers.map((u) => u._id);
    }

    const post = await Post.create({
      author: req.user._id,
      content: content || "",
      media,
      hashtags,
      mentions,
      visibility: visibility || "public",
    });

    await post.populate("author", "username profilePicture");

    // Notify mentioned users
    for (const mentionedId of mentions) {
      await sendNotif(
        mentionedId,
        req.user._id,
        "mention",
        post._id,
        `${req.user.username} mentioned you in a post.`,
      );
    }

    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get feed posts
// GET   /api/posts/feed
const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    const followingIds = [...currentUser.following, req.user._id];

    const posts = await Post.find({
      author: { $in: followingIds },
      visibility: { $in: ["public", "followers"] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username profilePicture isVerified")
      .populate("comments.user", "username profilePicture")
      .populate("sharedFrom");

    const total = await Post.countDocuments({
      author: { $in: followingIds },
      visibility: { $in: ["public", "followers"] },
    });

    res.json({ posts, page, totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get explore/public posts
// GET   /api/posts/explore
const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ visibility: "public" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username profilePicture isVerified");

    const total = await Post.countDocuments({ visibility: "public" });

    res.json({ posts, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get single post
// GET   /api/posts/:id
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username profilePicture isVerified")
      .populate("comments.user", "username profilePicture")
      .populate("sharedFrom");

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get user posts
// GET   /api/posts/user/:userId
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const visibilityFilter =
      req.params.userId === req.user._id.toString()
        ? {}
        : { visibility: "public" };

    const posts = await Post.find({
      author: req.params.userId,
      ...visibilityFilter,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username profilePicture isVerified");

    const total = await Post.countDocuments({
      author: req.params.userId,
      ...visibilityFilter,
    });

    res.json({ posts, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Like / Unlike post
// PUT   /api/posts/:id/like
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.addToSet(req.user._id);
      await sendNotif(
        post.author,
        req.user._id,
        "like",
        post._id,
        `${req.user.username} liked your post.`,
      );
    }

    await post.save();
    res.json({ likes: post.likes, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Add comment
// POST  /api/posts/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ error: "Comment text required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();

    await post.populate("comments.user", "username profilePicture");

    await sendNotif(
      post.author,
      req.user._id,
      "comment",
      post._id,
      `${req.user.username} commented on your post.`,
    );

    res.status(201).json({ comments: post.comments });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Delete comment
// DELETE /api/posts/:id/comment/:commentId
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (
      comment.user.toString() !== req.user._id.toString() &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Share post
// POST  /api/posts/:id/share
const sharePost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ error: "Post not found" });

    const sharedPost = await Post.create({
      author: req.user._id,
      content: req.body.content || "",
      sharedFrom: originalPost._id,
      visibility: "public",
    });

    originalPost.shareCount += 1;
    await originalPost.save();

    await sharedPost.populate("author", "username profilePicture");
    await sharedPost.populate("sharedFrom");

    await sendNotif(
      originalPost.author,
      req.user._id,
      "share",
      originalPost._id,
      `${req.user.username} shared your post.`,
    );

    res.status(201).json({ post: sharedPost });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Delete post
// DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getPost,
  getUserPosts,
  toggleLike,
  addComment,
  deleteComment,
  sharePost,
  deletePost,
};
