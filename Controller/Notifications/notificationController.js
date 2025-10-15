const admindb = require("../../Creators/admindb");

// ✅ Get all notifications for a user
exports.getNotifications = async (req, res) => {
  const { userid } = req.params;

  try {
    const notifications = await admindb
      .find({ userid })
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json({ ok: true, notifications });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ✅ Mark all notifications as seen for a user
exports.markNotificationsSeen = async (req, res) => {
  const { userid } = req.params;

  try {
    await admindb.updateMany({ userid, seen: false }, { seen: true });
    return res.status(200).json({ ok: true, message: "All notifications marked as seen" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ✅ Mark only activity notifications as seen for a user
exports.markActivityNotificationsSeen = async (req, res) => {
  const { userid } = req.params;

  try {
    // Mark only activity-related notifications as seen
    await admindb.updateMany(
      { 
        userid, 
        seen: false,
        message: {
          $regex: /request|fan meet|accepted|declined|cancelled|expired|completed/i
        }
      }, 
      { seen: true }
    );
    return res.status(200).json({ ok: true, message: "Activity notifications marked as seen" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ✅ Delete a notification by ID
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    await admindb.findByIdAndDelete(id);
    return res.status(200).json({ ok: true, message: "Notification deleted successfully" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
