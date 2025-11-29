const express = require('express');
const router = express.Router();
const getAdminReferralAnalytics = require('../../../Controller/Referral/getAdminReferralAnalytics');

router.get('/', getAdminReferralAnalytics);

module.exports = router;
