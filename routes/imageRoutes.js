const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const {
  uploadSingleFileToCloudinary,
  deleteFile,
  updateSingleFileToCloudinary,
  previewFile,
} = require("../utiils/appwrite");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage so file.buffer is available

// Appwrite API endpoint and project from env (fallbacks for local dev)
const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "668f9f8c0011a761d118";
const BUCKET_ID = "post"; // Force use of "post" bucket
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

// POST route to upload an image and save it to Cloudinary
router.post(
  "/save",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const file = req.files?.image?.[0] || req.files?.video?.[0];
      if (!file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      console.log("File received:", file);

      const result = await uploadSingleFileToCloudinary(file);
      console.log("Upload result:", result);
      const publicId = result?.public_id;

      if (!publicId) {
        return res
          .status(500)
          .json({ error: "Failed to receive public_id from Appwrite" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const posttype = req.files?.image ? "image" : "video";
      const proxy_view = `${baseUrl}/api/${posttype}/view?publicId=${publicId}`;
      const proxy_download = `${baseUrl}/api/${posttype}/download-file?publicId=${publicId}`;

      res.json({
        public_id: publicId,
        file_link: result?.file_link,
        proxy_view,
        proxy_download,
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET route to fetch file metadata (checks permissions). Server-side only.
router.get("/info", async (req, res) => {
  try {
    const { publicId, bucket } = req.query;
    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required." });
    }
    if (!APPWRITE_API_KEY) {
      return res
        .status(500)
        .json({ error: "APPWRITE_API_KEY is not set on server." });
    }
    const bucketId = bucket && bucket !== "default" ? bucket : BUCKET_ID;
    const url = `${ENDPOINT}/storage/buckets/${bucketId}/files/${publicId}`;
    const resp = await axios.get(url, {
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
        "X-Appwrite-Key": APPWRITE_API_KEY,
      },
    });
    res.json(resp.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err.message;
    res.status(status).json({ 
      error: typeof data === 'string' ? data : 'Request error',
      status: status 
    });
  }
});

// GET route to stream the actual file download via server (adds necessary headers)
router.get("/download", async (req, res) => {
  try {
    const { publicId, bucket } = req.query; // Get public_id from query params
    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required." });
    }

    const bucketId = bucket && bucket !== "default" ? bucket : BUCKET_ID;
    const url = `${ENDPOINT}/storage/buckets/${bucketId}/files/${publicId}/download?project=${PROJECT_ID}`;

    const resp = await axios.get(url, {
      responseType: "stream",
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
        ...(APPWRITE_API_KEY ? { "X-Appwrite-Key": APPWRITE_API_KEY } : {}),
      },
    });

    // Propagate content headers so browsers treat as download
    if (resp.headers["content-type"]) {
      res.setHeader("Content-Type", resp.headers["content-type"]);
    }
    if (resp.headers["content-length"]) {
      res.setHeader("Content-Length", resp.headers["content-length"]);
    }
    if (resp.headers["content-disposition"]) {
      res.setHeader("Content-Disposition", resp.headers["content-disposition"]);
    }

    resp.data.pipe(res);
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err.message;
    res.status(status).json({ 
      error: typeof data === 'string' ? data : 'Request error',
      status: status 
    });
  }
});

// GET route to stream the actual file via server (avoids client 401 by adding headers)
router.get("/view", async (req, res) => {
  try {
    const { publicId, bucket } = req.query;
    
    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required." });
    }
    const bucketId = bucket && bucket !== "default" ? bucket : BUCKET_ID;
    const url = `${ENDPOINT}/storage/buckets/${bucketId}/files/${publicId}/view?project=${PROJECT_ID}`;

    const resp = await axios.get(url, {
      responseType: "stream",
      headers: {
        "X-Appwrite-Project": PROJECT_ID,
        ...(APPWRITE_API_KEY ? { "X-Appwrite-Key": APPWRITE_API_KEY } : {}),
      },
      // Note: No API key needed for publicly readable files
    });

    // Propagate content headers
    if (resp.headers["content-type"]) {
      res.setHeader("Content-Type", resp.headers["content-type"]);
    }
    if (resp.headers["content-length"]) {
      res.setHeader("Content-Length", resp.headers["content-length"]);
    }

    resp.data.pipe(res);
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err.message;
    res.status(status).json({ 
      error: typeof data === 'string' ? data : 'File view error',
      status: status 
    });
  }
});

// DELETE route to delete an image from Cloudinary using public_id
router.delete("/delete", async (req, res) => {
  try {
    const { publicId } = req.body; // Get public_id from request body
    if (!publicId) {
      return res.status(400).json({ error: "Public ID is required." });
    }

    await deleteFile(publicId); // Delete the image
    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ 
      error: typeof err.message === 'string' ? err.message : 'Server error',
      status: 500 
    });
  }
});

// PUT route to update an image on Cloudinary (delete old and upload new)
router.put("/update", upload.single("image"), async (req, res) => {
  try {
    const { publicId } = req.body; // Get the public_id of the image to be replaced
    const file = req.file; // Get the new file to replace the old one
    if (!publicId || !file) {
      return res
        .status(400)
        .json({ error: "Public ID and file are required." });
    }

    // Update the image by deleting the old and uploading the new one
    const result = await updateSingleFileToCloudinary(publicId, file);

    res.json({ public_id: result?.public_id });
  } catch (err) {
    res.status(500).json({ 
      error: typeof err.message === 'string' ? err.message : 'Server error',
      status: 500 
    });
  }
});

module.exports = router;
