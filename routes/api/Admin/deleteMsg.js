const express = require('express')
const router = express.Router();
const editcreator = require('../../../Controller/Admin/deletenot');


router.route('/')
.post(editcreator)

module.exports = router;