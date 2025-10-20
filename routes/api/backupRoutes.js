const express = require('express');
const router = express.Router();
const { getBackupStatus, triggerBackup, cleanupBackups, getBackupStats } = require('../../Controller/Admin/backupManagement');
const verifyJwt = require('../../Middleware/verify');
const isAdmin = require('../../Middleware/isAdmin');

// Apply admin middleware to all backup routes
router.use(verifyJwt);
router.use(isAdmin);

/**
 * @route GET /api/backup/status
 * @desc Get backup status and history
 * @access Admin only
 */
router.get('/status', getBackupStatus);

/**
 * @route POST /api/backup/trigger
 * @desc Trigger manual backup
 * @access Admin only
 */
router.post('/trigger', triggerBackup);

/**
 * @route POST /api/backup/cleanup
 * @desc Clean up old backups manually
 * @access Admin only
 */
router.post('/cleanup', cleanupBackups);

/**
 * @route GET /api/backup/stats
 * @desc Get backup statistics
 * @access Admin only
 */
router.get('/stats', getBackupStats);

module.exports = router;
