const express = require('express')
const router = express.Router();
const editmodel = require('../../../Controller/Model/removeModelCrush');


router.route('/')
.post(editmodel)

module.exports = router;