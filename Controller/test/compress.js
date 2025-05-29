const express = require("express");
const multer = require("multer");
const { uploadSingleFileToCloudinary } = require("../../utiils/appwrite");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // file.buffer will be available

// POST /upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const folder = req.body.folder || "assets"; // optional

    const result = await uploadSingleFileToCloudinary(file, folder);

    res.status(200).json({
      message: "Upload successful",
      ...result,
    });
  } catch (error) {
    console.error("[UPLOAD ERROR]", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
