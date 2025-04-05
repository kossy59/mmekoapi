const express = require('express')
const router = express.Router();
const getpushaseexclusive = require('../../../Controller/Exclusive/getboughtExclusive');
const deletebuycontent = require('../../../Controller/Exclusive/deleteBuyeccluxive');

router.route('/')
.put(getpushaseexclusive)
.post(deletebuycontent)

module.exports = router;