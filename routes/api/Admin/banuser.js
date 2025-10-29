const express = require('express');
const router = express.Router();
const banUser = require('../../../Controller/Admin/banuser');

router.post('/', banUser);

module.exports = router;
