const express = require('express')
const router = express.Router();
const editmodel = require('../../../Controller/Admin/deletenot');


router.route('/')
.post(editmodel)

module.exports = router;