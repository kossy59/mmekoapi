const express = require('express');
const router = express.Router();
const pendingBalanceController = require('../../Controller/Admin/pendingBalanceController');
const isAdmin = require('../../Middleware/isAdmin');

// Admin-only routes for pending balance management
router.get('/stats', isAdmin, pendingBalanceController.getPendingBalanceStats);
router.post('/cleanup', isAdmin, pendingBalanceController.triggerCleanup);
router.get('/orphaned', isAdmin, pendingBalanceController.getOrphanedRequests);

module.exports = router;
