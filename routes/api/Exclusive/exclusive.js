const express = require('express')
const router = express.Router();
const postEclusive = require('../../../Controller/Exclusive/postExclusive');
const buy_exclusive = require('../../../Controller/Exclusive/pushasecontent');
const delete_exclusive = require('../../../Controller/Exclusive/deleteExclusive');

router.route('/')
.put(postEclusive)
.post(buy_exclusive)
.patch(delete_exclusive)

module.exports = router;