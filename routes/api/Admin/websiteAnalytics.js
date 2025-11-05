const express = require('express');
const router = express.Router();
const getWebsiteAnalytics = require('../../../Controller/Admin/websiteAnalytics');

// GET /api/admin/websiteanalytics?days=30
router.get('/', getWebsiteAnalytics);

module.exports = router;

