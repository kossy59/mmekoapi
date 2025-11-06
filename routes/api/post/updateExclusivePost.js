const express = require("express");
const router = express.Router();
const updateExclusivePost = require("../../../Controller/Post/updateExclusivePost");
const multer = require("multer");

/**
 * This implementation allows for in memory file upload manipulation
 * This prevents accessing the filesystem of the hosted server
 */
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route("/").put(upload.single("file"), updateExclusivePost);

module.exports = router;

