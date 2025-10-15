const express = require('express');
const router = express.Router();
const vipAnalysis = require('../../../Controller/Admin/vipAnalysis');
const verifyJwt = require('../../../Middleware/verify');
const isAdmin = require('../../../Middleware/isAdmin');

router.route('/')
  .get(verifyJwt, isAdmin, vipAnalysis);

module.exports = router;
