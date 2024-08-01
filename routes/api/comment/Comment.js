const express = require('express')
const router = express.Router();
const Newcomment = require('../../../Controller/Comment/newComment');
const editComment = require('../../../Controller/Comment/Editcomment');
const deleteComment = require('../../../Controller/Comment/Removecomment');

router.route('/')
.put(Newcomment)
.post(editComment)
.patch(deleteComment)

module.exports = router;