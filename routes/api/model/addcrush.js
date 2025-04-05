const express = require('express')
const router = express.Router();
const editmodel = require('../../../Controller/Model/addModelcrush');


router.route('/')
.post(editmodel)

module.exports = router;