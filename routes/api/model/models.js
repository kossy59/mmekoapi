const express = require('express')
const router = express.Router();
const createmodel = require('../../../Controller/Model/newmodel');
const getmymodel = require('../../../Controller/Model/getmymodel')

router.route('/')
.put(createmodel)
.post(getmymodel)


module.exports = router;