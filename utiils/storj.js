/**
 * Storj Storage Helper (buffers + optional media processing)
 * Replaces Appwrite functionality with Storj S3-compatible storage
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const axios = require('axios');
const { processVideo, compressImage } = require("./compress");

// -----------------------------
// Configuration (env required)
// -----------------------------

// Try to load dotenv if not already loaded
if (!process.env.STORJ_ACCESS_KEY_ID) {
  try {
    console.log('[Storj Debug] Attempting to load dotenv...');
    const result = require('dotenv').config();
    console.log('[Storj Debug] Dotenv result:', result);
  } catch (e) {
    console.log('[Storj Debug] Dotenv error:', e.message);
    // dotenv might not be available, continue with system env vars
  }
}

const STORJ_ACCESS_KEY_ID = process.env.STORJ_ACCESS_KEY_ID;
const STORJ_SECRET_ACCESS_KEY = process.env.STORJ_SECRET_ACCESS_KEY;
const STORJ_ENDPOINT = process.env.STORJ_ENDPOINT;
const STORJ_BUCKET_DEFAULT = process.env.STORJ_BUCKET_DEFAULT || "post";
const STORJ_BUCKET_POST = process.env.STORJ_BUCKET_POST || "post";
const STORJ_BUCKET_PROFILE = process.env.STORJ_BUCKET_PROFILE || "profile";
const STORJ_BUCKET_CREATOR = process.env.STORJ_BUCKET_CREATOR || "creator";
const STORJ_BUCKET_CREATOR_APPLICATION = process.env.STORJ_BUCKET_CREATOR_APPLICATION || "creator-application";
const STORJ_BUCKET_MESSAGE = process.env.STORJ_BUCKET_MESSAGE || "message";
const STORJ_PUBLIC_ACCESS_GRANT = process.env.STORJ_PUBLIC_ACCESS_GRANT || "";
const STORJ_LINKSHARE_API = process.env.STORJ_LINKSHARE_API || "https://api.link.storjshare.io";

if (!STORJ_ACCESS_KEY_ID || !STORJ_SECRET_ACCESS_KEY || !STORJ_ENDPOINT) {
  console.error('[Storj Config Debug] Environment variables status:');
  console.error('STORJ_ACCESS_KEY_ID:', STORJ_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
  console.error('STORJ_SECRET_ACCESS_KEY:', STORJ_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
  console.error('STORJ_ENDPOINT:', STORJ_ENDPOINT ? 'SET' : 'NOT SET');
  console.error('Current working directory:', process.cwd());
  console.error('Node environment:', process.env.NODE_ENV);

  throw new Error(
    "[Storj Config] Missing one of STORJ_ACCESS_KEY_ID / STORJ_SECRET_ACCESS_KEY / STORJ_ENDPOINT env vars. " +
    "Please check your .env file or system environment variables."
  );
}

// -----------------------------
// Storj S3 Client (AWS SDK v3)
// -----------------------------
const s3Client = new S3Client({
  endpoint: STORJ_ENDPOINT,
  region: 'us-east-1', // Storj uses us-east-1 as default region
  credentials: {
    accessKeyId: STORJ_ACCESS_KEY_ID,
    secretAccessKey: STORJ_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for Storj (was s3ForcePathStyle in v2)
});

// -----------------------------
// Utils
// -----------------------------
const getBucketName = (folder) => {
  switch (folder) {
    case 'post':
      return STORJ_BUCKET_POST;
    case 'profile':
      return STORJ_BUCKET_PROFILE;
    case 'creator':
      return STORJ_BUCKET_CREATOR;
    case 'creator-application':
      return STORJ_BUCKET_CREATOR_APPLICATION;
    case 'message':
      return STORJ_BUCKET_MESSAGE;
    default:
      return STORJ_BUCKET_DEFAULT;
  }
};

const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}.${extension}`;
};

const getFileUrl = (bucket, key) => {
  // Storj public URL format
  return `${STORJ_ENDPOINT}/${bucket}/${key}`;
};

// Attempt to create a public link via Storj Linksharing API (recommended for public assets)
async function createLinkshareUrl(bucket, key) {
  if (!STORJ_PUBLIC_ACCESS_GRANT) {
    return "";
  }
  try {
    const body = {
      access: STORJ_PUBLIC_ACCESS_GRANT,
      paths: [`sj://${bucket}/${key}`],
      public: true,
    };
    const res = await axios.post(`${STORJ_LINKSHARE_API}/api/v1/share`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // Reduced timeout
    });
    // API may return an array of objects with 'url' or a single object
    const data = res.data;
    if (Array.isArray(data) && data.length > 0 && typeof data[0]?.url === 'string') {
      return data[0].url;
    }
    if (data && typeof data.url === 'string') {
      return data.url;
    }
  } catch (err) {
    // Non-fatal; fall back to gateway URL or proxy
  }
  return "";
}

// -----------------------------
// Media Processing
// -----------------------------
async function processBufferByMime(buffer, filename, mimetype) {
  if (mimetype && mimetype.startsWith("image/")) {
    return compressImage(buffer);
  }
  return buffer;
}

// -----------------------------
// saveFile (from disk path)
// -----------------------------
async function saveFile(file, filePath, folder = STORJ_BUCKET_DEFAULT) {
  if (!filePath) {
    return { public_id: "", file_link: "" };
  }

  const bucket = getBucketName(folder);
  const path = require('path');
  const originalname = path.basename(filePath);
  const mimetype = undefined;

  try {
    const fs = require('fs');

    // Read file into memory
    const buffer = fs.readFileSync(filePath);
    const processedBuffer = await processBufferByMime(buffer, originalname, mimetype);

    const key = generateUniqueFileName(originalname);

    const params = {
      Bucket: bucket,
      Key: key,
      Body: processedBuffer,
      ContentType: mimetype,
      ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(params));

    // Clean up local file after upload
    try {
      fs.unlinkSync(filePath);
    } catch (_) { }

    let fileUrl = await createLinkshareUrl(bucket, key);
    if (!fileUrl) fileUrl = getFileUrl(bucket, key);

    return {
      public_id: key,
      file_link: fileUrl,
    };
  } catch (error) {
    return { public_id: "", file_link: "" };
  }
}

// -----------------------------
// uploadSingleFileToCloudinary (buffer → Storj)
// -----------------------------
async function uploadSingleFileToCloudinary(file, folder = STORJ_BUCKET_DEFAULT) {
  const bucket = getBucketName(folder);

  if (!file) return { public_id: "", file_link: "" };

  try {
    const processedBuffer = await processBufferByMime(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const key = generateUniqueFileName(file.originalname);

    const params = {
      Bucket: bucket,
      Key: key,
      Body: processedBuffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(params));

    let fileUrl = await createLinkshareUrl(bucket, key);
    if (!fileUrl) fileUrl = getFileUrl(bucket, key);

    return {
      public_id: key,
      file_link: fileUrl,
    };
  } catch (error) {
    return { public_id: "", file_link: "" };
  }
}

// -----------------------------
// uploadManyFilesToCloudinary (buffers → Storj)
// -----------------------------
async function uploadManyFilesToCloudinary(files, folder = STORJ_BUCKET_DEFAULT) {
  const bucket = getBucketName(folder);

  if (!files || files.length === 0) return [];

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const processedBuffer = await processBufferByMime(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        const key = generateUniqueFileName(file.originalname);

        const params = {
          Bucket: bucket,
          Key: key,
          Body: processedBuffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        };

        await s3Client.send(new PutObjectCommand(params));

        let fileUrl = await createLinkshareUrl(bucket, key);
        if (!fileUrl) fileUrl = getFileUrl(bucket, key);

        return {
          public_id: key,
          file_link: fileUrl,
          filename: file.originalname,
        };
      } catch (error) {
        return {
          public_id: "",
          file_link: "",
          filename: file.originalname,
        };
      }
    })
  );

  return results;
}

// -----------------------------
// deleteFile (single)
// -----------------------------
async function deleteFile(publicId, folder = STORJ_BUCKET_DEFAULT) {
  const bucket = getBucketName(folder);

  if (!publicId) {
    console.warn("[deleteFile] No public_id provided");
    return false;
  }

  try {
    const params = {
      Bucket: bucket,
      Key: publicId,
    };

    await s3Client.send(new DeleteObjectCommand(params));
    console.log(`[deleteFile] Successfully deleted ${publicId} from ${bucket}`);
    return true;
  } catch (error) {
    console.error(`[deleteFile] Error deleting ${publicId}:`, error?.message || error);
    return false;
  }
}

// -----------------------------
// updateSingleFileToCloudinary (delete old + upload new)
// -----------------------------
async function updateSingleFileToCloudinary(oldPublicId, newFile, folder = STORJ_BUCKET_DEFAULT) {
  const bucket = getBucketName(folder);

  try {
    // Delete old file
    if (oldPublicId) {
      await deleteFile(oldPublicId, folder);
    }

    // Upload new file
    const result = await uploadSingleFileToCloudinary(newFile, folder);
    return result;
  } catch (error) {
    return { public_id: "", file_link: "" };
  }
}

// -----------------------------
// updateManyFileToCloudinary (delete many + upload many)
// Signature kept for backward compatibility with controllers
// -----------------------------
async function updateManyFileToCloudinary(oldPublicIds = [], newFiles = [], folder = STORJ_BUCKET_DEFAULT) {
  const bucket = getBucketName(folder);

  try {
    // Best-effort delete of old files
    if (Array.isArray(oldPublicIds) && oldPublicIds.length > 0) {
      await Promise.all(
        oldPublicIds
          .filter(Boolean)
          .map((publicId) => deleteFile(publicId, folder).catch(() => false))
      );
    }

    // Upload new files
    if (Array.isArray(newFiles) && newFiles.length > 0) {
      const results = await uploadManyFilesToCloudinary(newFiles, folder);
      return results;
    }

    return [];
  } catch (error) {
    return [];
  }
}

// -----------------------------
// previewFile (get file info)
// -----------------------------
async function previewFile(publicId, folder = STORJ_BUCKET_DEFAULT) {
  const bucket = getBucketName(folder);

  if (!publicId) {
    return null;
  }

  try {
    const params = {
      Bucket: bucket,
      Key: publicId,
    };

    const response = await s3Client.send(new HeadObjectCommand(params));
    return {
      size: response.ContentLength,
      lastModified: response.LastModified,
      contentType: response.ContentType,
      etag: response.ETag,
    };
  } catch (error) {
    console.error(`[previewFile] Error getting info for ${publicId}:`, error?.message || error);
    return null;
  }
}

// -----------------------------
// streamFile (read via SDK and return stream + headers)
// -----------------------------
async function streamFile(publicId, folder = STORJ_BUCKET_DEFAULT, start, end) {
  const bucket = getBucketName(folder);
  if (!publicId) return null;
  try {
    const params = {
      Bucket: bucket,
      Key: publicId
    };

    // Add Range parameter if start/end are provided
    if (typeof start === 'number') {
      const rangeString = `bytes=${start}-${typeof end === 'number' ? end : ''}`;
      params.Range = rangeString;
    }

    const response = await s3Client.send(new GetObjectCommand(params));

    // In AWS SDK v3, Body is a stream (IncomingMessage in Node.js)
    // We can pass it directly or wrap it if needed.
    // However, the original code created a new Readable and pushed the Buffer.
    // Here we can just return the stream directly if the consumer expects a stream.
    // The previous implementation suggested the consumer expects a stream property 'body'.

    return {
      body: response.Body, // This is already a readable stream in v3 Node.js
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag,
      contentRange: response.ContentRange, // Important for 206 responses
      acceptRanges: response.AcceptRanges,
    };
  } catch (error) {
    return null;
  }
}

// -----------------------------
// getSignedViewUrl (temporary public URL)
// -----------------------------
async function getSignedViewUrl(publicId, folder = STORJ_BUCKET_DEFAULT, expiresSeconds = 600) {
  const bucket = getBucketName(folder);
  if (!publicId) return '';
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: publicId,
    });

    // getSignedUrl is async in v3
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: Math.max(60, Math.min(7 * 24 * 3600, Number(expiresSeconds) || 600)),
    });
    return url;
  } catch (error) {
    console.error('[getSignedViewUrl] Error:', error?.message || error);
    return '';
  }
}

// -----------------------------
// Export functions (maintaining compatibility with existing code)
// -----------------------------
module.exports = {
  uploadSingleFileToCloudinary,
  uploadManyFilesToCloudinary,
  saveFile,
  deleteFile,
  updateSingleFileToCloudinary,
  updateManyFileToCloudinary,
  previewFile,
  streamFile,
  getSignedViewUrl,
  getFileUrl,
  getBucketName,
};
