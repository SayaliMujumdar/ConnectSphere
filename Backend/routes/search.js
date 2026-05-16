const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");

// @desc  Search users, posts, hashtags
// GET   /api/search?q=query&type=users|posts|hashtags
router.get("/", protect, async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ error: "Search query required" });
    }

    const query = q.trim();
    const results = {};

    if (!type || type === "users") {
      results.users = await User.find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { bio: { $regex: query, $options: "i" } },
        ],
      })
        .select("username profilePicture bio followers isVerified")
        .limit(20);
    }

    if (!type || type === "posts") {
      results.posts = await Post.find({
        $or: [
          { content: { $regex: query, $options: "i" } },
          { hashtags: { $in: [query.toLowerCase().replace("#", "")] } },
        ],
        visibility: "public",
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("author", "username profilePicture isVerified");
    }

    if (!type || type === "hashtags") {
      const hashtagResults = await Post.aggregate([
        { $unwind: "$hashtags" },
        {
          $match: {
            hashtags: { $regex: query.replace("#", ""), $options: "i" },
          },
        },
        { $group: { _id: "$hashtags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]);
      results.hashtags = hashtagResults;
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @desc  Get trending hashtags
// GET   /api/search/trending
router.get("/trending", protect, async (req, res) => {
  try {
    const trending = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ trending });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
