const express = require('express')
const router = express.Router();
const createPost = require('../../../Controller/Post/userpost')
const editPost = require('../../../Controller/Post/Editpost')
const deletePost =  require('../../../Controller/Post/Removepost')
const multer = require('multer')
const fs = require('fs').promises;
const path = require('path')
const handleRefresh = require('../../../Middleware/refresh')
const verifyJwt = require('../../../Middleware/verify')

// Multer configuration for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // const uploadDir = path.join(__dirname, 'uploads');
    const rootDir = process.cwd();
    const uploadDir = path.join(rootDir, 'uploads');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.route('/')
.put(upload.single('postFile'), handleRefresh, createPost)
.post(editPost)
.patch(deletePost)

module.exports = router;