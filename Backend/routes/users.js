const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getUserById,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getSuggestedUsers,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/suggestions", protect, getSuggestedUsers);
router.get("/id/:id", protect, getUserById);
router.get("/:username", protect, getUserProfile);
router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  updateProfile,
);
router.put("/:id/follow", protect, toggleFollow);
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);

module.exports = router;
