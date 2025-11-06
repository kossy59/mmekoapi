const express = require("express");
const router = express.Router();
const createExclusivePost = require("../../../Controller/Post/createExclusivePost");
const multer = require("multer");

/**
 * This implementation allows for in memory file upload manipulation
 * This prevents accessing the filesystem of the hosted server
 */
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route("/").post(upload.single("file"), createExclusivePost);

module.exports = router;
