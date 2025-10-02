const express = require('express')
const router = express.Router();

const getcreatorbyid = require('../../../Controller/Creator/getcreatorbyid')

router.route('/')
.patch(getcreatorbyid)

module.exports = router;
