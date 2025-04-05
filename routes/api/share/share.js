const express = require('express')
const router = express.Router();
const createsharePost = require('../../../Controller/Share/newShare')
const editsharePost = require('../../../Controller/Share/Editesharepost')
const removesharePost =  require('../../../Controller/Share/Removesharepost')

router.route('/')
.put(createsharePost)
.post(editsharePost)
.delete(removesharePost)

module.exports = router;