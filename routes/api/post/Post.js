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
// .options((req, res) => {
//   // Determine the allowed methods for this endpoint
//   const allowedMethods = ['GET', 'POST', 'OPTIONS', 'PATCH'];

//   // Set the 'Allow' header
//   res.setHeader('Allow', allowedMethods.join(', '));

//   res.setHeader('access-control-allow-credentials', true);
//   res.setHeader('access-control-allow-origin', 'https://mmeko.com');

//   // Set CORS headers (Express-CORS handles most of this, but be explicit if needed)
//   res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   // res.setHeader('Access-Control-Max-Age', '3600'); // Optional

//   // Respond with a 204 No Content status for OPTIONS requests
//   res.sendStatus(204);
// })
.put((req, res) => {
  // Determine the allowed methods for this endpoint
  const allowedMethods = ['GET', 'POST', 'OPTIONS', 'PATCH'];

  // Set the 'Allow' header
  res.setHeader('Allow', allowedMethods.join(', '));

  res.setHeader('access-control-allow-credentials', true);
  // res.setHeader('access-control-allow-origin', 'https://mmeko.com');
  res.setHeader('access-control-allow-origin', 'https://mmeko.com');

  // Set CORS headers (Express-CORS handles most of this, but be explicit if needed)
  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}, upload.single('postFile'), handleRefresh, createPost)
.post(editPost)
.patch(deletePost)

module.exports = router;