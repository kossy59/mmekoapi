const express = require('express');
const router = express.Router();
const getLikesByPost = require('../../../Controller/Like/GetLikesByPost');

router.route('/')
  .get(getLikesByPost);

module.exports = router;