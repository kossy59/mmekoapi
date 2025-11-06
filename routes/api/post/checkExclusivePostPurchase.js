const express = require('express');
const router = express.Router();
const checkExclusivePostPurchase = require('../../../Controller/Post/checkExclusivePostPurchase');

router.route('/')
  .post(checkExclusivePostPurchase);

module.exports = router;

