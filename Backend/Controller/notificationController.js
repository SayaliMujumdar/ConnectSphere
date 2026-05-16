const Notification = require("../models/Notification");

// @desc  Get notifications for current user
// GET   /api/notifications
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username profilePicture")
      .populate("post", "content media");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Mark notification(s) as read
// PUT   /api/notifications/read
const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: req.user._id },
        { read: true },
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { recipient: req.user._id },
        { read: true },
      );
    }

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// @desc  Delete notification
// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification)
      return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
