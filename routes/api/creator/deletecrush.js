const express = require('express')
const router = express.Router();
const editcreator = require('../../../Controller/Creator/removeCreatorCrush');


router.route('/')
.post(editcreator)

module.exports = router;