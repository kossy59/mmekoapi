const express = require('express');
const router = express.Router();
const cleanupStatus = require('../../Controller/Admin/cleanupStatus');
const isAdmin = require('../../Middleware/isAdmin');

// Admin-only routes for cleanup management
router.get('/status', isAdmin, cleanupStatus.getCleanupStatus);
router.post('/trigger', isAdmin, cleanupStatus.triggerCleanup);
router.get('/orphaned', isAdmin, cleanupStatus.getOrphanedRequests);

module.exports = router;
