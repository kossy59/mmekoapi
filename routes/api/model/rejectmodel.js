const express = require('express')
const router = express.Router();
const rejectmodel = require('../../../Controller/Model/rejectmode');


router.route('/')
.post(rejectmodel)

module.exports = router;