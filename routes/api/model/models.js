const express = require('express')
const router = express.Router();
const createmodel = require('../../../Controller/Model/newmodel');
const getmymodel = require('../../../Controller/Model/getmymodel')
const getmodelbyid = require('../../../Controller/Model/getmodelbyid')

router.route('/')
.put(createmodel)
.post(getmymodel)
.patch(getmodelbyid)

module.exports = router;