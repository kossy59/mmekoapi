const express = require('express')
const router = express.Router();
const editcreator = require('../../../Controller/Creator/deletecreator');


router.route('/')
.post(editcreator)

module.exports = router;
