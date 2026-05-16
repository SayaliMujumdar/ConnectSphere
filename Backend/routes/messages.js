const express = require("express");
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  createGroup,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/conversation", protect, getOrCreateConversation);
router.post("/group", protect, createGroup);
router.get("/conversations", protect, getConversations);
router.get("/:conversationId", protect, getMessages);
router.post("/:conversationId", protect, upload.single("media"), sendMessage);

module.exports = router;
