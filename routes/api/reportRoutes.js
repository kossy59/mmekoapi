const express = require('express');
const router = express.Router();
const { 
  getReportStats, 
  updateReportStatus 
} = require('../../Controller/SupportChat/reportHandler');
const isAdmin = require('../../Middleware/isAdmin');

// Get report statistics (admin only)
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const stats = await getReportStats();
    res.status(200).json({ 
      ok: true, 
      stats 
    });
  } catch (error) {
    console.error('Error getting report stats:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Failed to get report statistics' 
    });
  }
});

// Update report status (admin only)
router.put('/:reportId/status', isAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id; // Assuming admin ID is in req.user

    if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Invalid status' 
      });
    }

    const result = await updateReportStatus(reportId, status, adminId, notes);
    
    if (result.success) {
      res.status(200).json({ 
        ok: true, 
        message: result.message,
        report: result.report 
      });
    } else {
      res.status(400).json({ 
        ok: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Failed to update report status' 
    });
  }
});

module.exports = router;
