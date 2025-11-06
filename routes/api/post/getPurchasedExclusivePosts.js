const express = require('express');
const router = express.Router();
const getPurchasedExclusivePosts = require('../../../Controller/Post/getPurchasedExclusivePosts');

router.route('/')
  .post(getPurchasedExclusivePosts);

module.exports = router;

