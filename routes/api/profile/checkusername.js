const express = require('express');
const router = express.Router();
const checkUsername = require('../../../Controller/profile/checkusername');

router.route('/')
  .post(checkUsername);

module.exports = router;
