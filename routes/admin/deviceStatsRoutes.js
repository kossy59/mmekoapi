/**
 * Routes for device fingerprint statistics (Admin only)
 */

const express = require('express');
const router = express.Router();
const { getDeviceStats, getSuspiciousDevices } = require('../../Controller/Admin/deviceStats');
const verifyJWT = require('../../Middleware/verify');

// All routes require authentication and admin privileges
router.use(verifyJWT);

/**
 * GET /api/admin/device-stats
 * Get overall device fingerprint statistics
 */
router.get('/device-stats', getDeviceStats);

/**
 * GET /api/admin/suspicious-devices
 * Get list of suspicious devices (multiple accounts)
 */
router.get('/suspicious-devices', getSuspiciousDevices);

module.exports = router;
