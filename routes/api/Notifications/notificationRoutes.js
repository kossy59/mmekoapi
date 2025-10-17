const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationsSeen,
  markActivityNotificationsSeen,
  deleteNotification,
} = require("../../../Controller/Notifications/notificationController");

// Get all notifications for a specific user
router.get("/:userid", getNotifications);

// Mark all user notifications as seen
router.put("/mark-seen/:userid", markNotificationsSeen);

// Mark only activity notifications as seen
router.put("/mark-activity-seen/:userid", markActivityNotificationsSeen);

// Delete a specific notification
router.delete("/:id", deleteNotification);

module.exports = router;
