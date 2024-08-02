const express = require('express')
const router = express.Router();
const createPost = require('../../../Controller/Post/userpost')
const editPost = require('../../../Controller/Post/Editpost')
const deletePost =  require('../../../Controller/Post/Removepost')

router.route('/')
.put(createPost)
.post(editPost)
.patch(deletePost)

module.exports = router;