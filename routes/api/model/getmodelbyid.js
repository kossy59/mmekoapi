const express = require('express')
const router = express.Router();

const getmodelbyid = require('../../../Controller/Model/getmodelbyid')

router.route('/')
.patch(getmodelbyid)

module.exports = router;
