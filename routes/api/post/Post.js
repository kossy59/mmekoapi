const express = require("express");
const router = express.Router();
const cors = require("cors");
const createPost = require("../../../Controller/Post/userpost");
const editPost = require("../../../Controller/Post/Editpost");
const deletePost = require("../../../Controller/Post/Removepost");
const multer = require("multer");
const handleRefresh = require("../../../Middleware/refresh");

/**
 * This implementation uploads the file to a folder on the server
 * and manipulates the filesystem of the server
 */
/*
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
*/

/**
 * This implementation allows for in memory file upload manipulation
 * This prevents accessing the filesystem of the hosted server
 */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/*const handleSingleFileUpload = (req, res, next) => {
  // Determine the dynamic field name
  const fieldName = req.body.uploadFieldName; // Example: get from request body

  // Create the Multer middleware dynamically
  const uploadSingle = upload.single(fieldName);

  // Execute the Multer middleware
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ error: 'Multer error', details: err });
    } else if (err) {
      return res.status(500).json({ error: 'Unknown error', details: err });
    }
    // 4. If no Multer error, proceed to the next middleware (handleRefresh)
    next();
  })
}*/

/**
 * The handleRefresh middleware is used to intersect the result of file manipulation
 * by multer which exposes the token for it
 * Without this, authorization fails!
 */
router
  .route("/")
  .post(upload.single("postFile"), createPost)
  .put(editPost)
  .delete(deletePost);

module.exports = router;

/*router.post('/', (req, res, next) => {
    // 1. Determine the dynamic field name
    const dynamicFieldName = req.body.uploadFieldName || 'postFile'; // Example: get from request body

    // 2. Create the Multer middleware dynamically
    const uploadSingle = upload.single(dynamicFieldName);

    // 3. Execute the Multer middleware
    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: 'Multer error', details: err });
        } else if (err) {
            return res.status(500).json({ error: 'Unknown error', details: err });
        }
        // 4. If no Multer error, proceed to the next middleware (handleRefresh)
        next();
    });
}, handleRefresh, Editprofile);*/
