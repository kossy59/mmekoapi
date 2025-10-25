const Report = require('../../Creators/report');
const User = require('../../Creators/userdb');
const { pushAdminNotification } = require('../../utiils/sendPushnot');

/**
 * Handle report-specific logic for support chat
 */
const handleReportCategory = async (supportChat, message, userid) => {
  try {
    const { category } = supportChat;
    
    // Only handle report categories
    if (!['Report a Fan', 'Report a Creator'].includes(category)) {
      return { success: true, handled: false };
    }

    console.log(`🚨 Processing report: ${category} from user ${userid}`);

    // Create a report record
    const reportData = {
      reporterId: userid,
      category: category,
      description: message,
      status: 'pending',
      priority: 'high', // Reports should have high priority
      createdAt: Date.now(),
      supportChatId: supportChat._id
    };

    const report = new Report(reportData);
    await report.save();

    // Update support chat with report reference
    supportChat.reportId = report._id;
    supportChat.priority = 'high';
    await supportChat.save();

    // Send special notification to admins for reports
    try {
      const adminUsers = await User.find({ 
        $or: [
          { isAdmin: true },
          { admin: true }
        ]
      }).exec();
      
      for (const admin of adminUsers) {
        await pushAdminNotification(
          admin._id, 
          `🚨 URGENT: ${category} - ${message.substring(0, 50)}...`,
          'report'
        );
      }
    } catch (notificationError) {
      console.error('Error sending report notifications:', notificationError);
    }

    console.log(`✅ Report created successfully: ${report._id}`);
    
    return { 
      success: true, 
      handled: true, 
      reportId: report._id,
      message: 'Report has been submitted and will be reviewed by our team'
    };

  } catch (error) {
    console.error('Error handling report category:', error);
    return { 
      success: false, 
      handled: false, 
      error: error.message 
    };
  }
};

/**
 * Get report statistics for admin dashboard
 */
const getReportStats = async () => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    return {
      total: totalReports,
      pending: pendingReports,
      resolved: resolvedReports,
      byStatus: stats
    };
  } catch (error) {
    console.error('Error getting report stats:', error);
    return null;
  }
};

/**
 * Update report status
 */
const updateReportStatus = async (reportId, status, adminId, notes) => {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      return { success: false, message: 'Report not found' };
    }

    report.status = status;
    report.resolvedAt = status === 'resolved' ? Date.now() : null;
    report.resolvedBy = adminId;
    report.adminNotes = notes;
    report.updatedAt = Date.now();

    await report.save();

    return { 
      success: true, 
      message: 'Report status updated successfully',
      report 
    };
  } catch (error) {
    console.error('Error updating report status:', error);
    return { 
      success: false, 
      message: 'Failed to update report status',
      error: error.message 
    };
  }
};

module.exports = {
  handleReportCategory,
  getReportStats,
  updateReportStatus
};
