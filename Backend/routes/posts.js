const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/feed", protect, getFeedPosts);
router.get("/explore", protect, getExplorePosts);
router.post("/", protect, upload.array("media", 10), createPost);
router.get("/user/:userId", protect, getUserPosts);
router.get("/:id", protect, getPost);
router.put("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.delete("/:id/comment/:commentId", protect, deleteComment);
router.post("/:id/share", protect, sharePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
