// middlewares/upload.js
const multer = require("multer");

// Use memory storage so files are kept in memory as buffers
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
