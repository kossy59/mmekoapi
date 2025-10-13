const express = require('express')
const router = express.Router();

const getcreatorbyportfolioid = require('../../../Controller/Creator/getcreatorbyportfolioid')

router.route('/')
.patch(getcreatorbyportfolioid)

module.exports = router;
