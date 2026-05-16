const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { getIO, getOnlineUsers } = require("../socket");

// @desc  Get or create conversation
// POST  /api/messages/conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId)
      return res.status(400).json({ error: "Participant ID required" });

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, participantId], $size: 2 },
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId],
        isGroup: false,
      });
      conversation = await conversation.populate(
        "participants",
        "username profilePicture isOnline lastSeen",
      );
    }

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get all conversations for current user
// GET   /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      })
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Get messages for a conversation
// GET   /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation: req.params.conversationId,
      deletedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username profilePicture");

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } },
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Send a message
// POST  /api/messages/:conversationId
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (!content && !req.file) {
      return res
        .status(400)
        .json({ error: "Message must have content or media" });
    }

    const messageData = {
      conversation: req.params.conversationId,
      sender: req.user._id,
      content: content || "",
      readBy: [req.user._id],
    };

    if (req.file) {
      messageData.media = `/uploads/${req.file.filename}`;
      messageData.mediaType = req.file.mimetype.startsWith("video")
        ? "video"
        : "image";
    }

    const message = await Message.create(messageData);
    await message.populate("sender", "username profilePicture");

    // Update conversation lastMessage
    conversation.lastMessage = message._id;
    await conversation.save();

    // Emit to all conversation participants via socket
    const io = getIO();
    const onlineUsers = getOnlineUsers();
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        const socketId = onlineUsers.get(participantId.toString());
        if (socketId) {
          io.to(socketId).emit("newMessage", {
            conversationId: req.params.conversationId,
            message,
          });
        }
      }
    });

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Create group conversation
// POST  /api/messages/group
const createGroup = async (req, res) => {
  try {
    const { participantIds, groupName } = req.body;
    if (!participantIds || participantIds.length < 2) {
      return res
        .status(400)
        .json({ error: "Group needs at least 2 other participants" });
    }

    const allParticipants = [req.user._id, ...participantIds];

    const conversation = await Conversation.create({
      participants: allParticipants,
      isGroup: true,
      groupName: groupName || "Group",
      groupAdmin: req.user._id,
    });

    await conversation.populate("participants", "username profilePicture");
    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  createGroup,
};
