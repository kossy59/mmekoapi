const express = require('express');
const router = express.Router();
const purchaseExclusivePost = require('../../../Controller/Post/purchaseExclusivePost');

router.route('/')
  .post(purchaseExclusivePost);

module.exports = router;

