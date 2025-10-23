const express = require('express');
const router = express.Router();
const { manualCleanup, getStats, getCleanupPreview } = require('../../../Controller/Admin/notificationCleanup');
const isAdmin = require('../../../Middleware/isAdmin');

// All routes require admin authentication
router.use(isAdmin);

/**
 * GET /api/admin/notifications/stats
 * Get notification statistics
 */
router.get('/stats', getStats);

/**
 * GET /api/admin/notifications/cleanup-preview
 * Preview notifications that would be deleted in next cleanup
 */
router.get('/cleanup-preview', getCleanupPreview);

/**
 * DELETE /api/admin/notifications/cleanup
 * Manually trigger cleanup of old notifications
 */
router.delete('/cleanup', manualCleanup);

module.exports = router;
