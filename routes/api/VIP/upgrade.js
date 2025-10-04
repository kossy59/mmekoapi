const express = require('express');
const router = express.Router();
const { upgradeToVip, checkVipStatus, cancelVip } = require('../../../Controller/VIP/upgradeToVip');
const addCoinsToUser = require('../../../Controller/VIP/addCoins');
const getUserBalance = require('../../../Controller/VIP/getUserBalance');
const continueVip = require('../../../Controller/VIP/continueVip');
const triggerAutoRenewal = require('../../../Controller/VIP/triggerAutoRenewal');
const celebrationRoutes = require('./celebration');

// Upgrade user to VIP
router.post('/upgrade', upgradeToVip);

// Check VIP status
router.post('/status', checkVipStatus);

// Cancel VIP subscription
router.post('/cancel', cancelVip);

// Continue VIP (re-enable auto-renewal)
router.post('/continue', continueVip);

// Add coins to user
router.post('/add-coins', addCoinsToUser);

// Get user balance
router.post('/balance', getUserBalance);

// Trigger auto-renewal process (for testing)
router.post('/trigger-renewal', triggerAutoRenewal);

// VIP celebration routes
router.use('/celebration', celebrationRoutes);

module.exports = router;
