const express = require('express')
const router = express.Router();
const rejectcreator = require('../../../Controller/Creator/rejectmode');


router.route('/')
.post(rejectcreator)

module.exports = router;