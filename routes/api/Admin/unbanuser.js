const express = require('express');
const router = express.Router();
const unbanUser = require('../../../Controller/Admin/unbanuser');

router.post('/', unbanUser);

module.exports = router;