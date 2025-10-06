/**
 * Appwrite Storage Helper (buffers + optional media processing)
 * Works with REST uploads for reliability across node-appwrite versions.
 */

const sdk = require("node-appwrite");
const axios = require("axios");
const FormData = require("form-data");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");

const { processVideo, compressImage } = require("./compress");

// -----------------------------
// Configuration (env required)
// -----------------------------
const ENDPOINT =
  process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID; // required
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; // required
const BUCKET_ID = "post"; // Force use of "post" bucket

if (!PROJECT_ID || !APPWRITE_API_KEY || !BUCKET_ID) {
  // Fail fast so you notice misconfigurations early.
  throw new Error(
    "[Appwrite Config] Missing one of APPWRITE_PROJECT_ID / APPWRITE_API_KEY / APPWRITE_BUCKET_ID env vars."
  );
}

// -----------------------------
// Appwrite SDK client (for non-upload ops + quick URLs)
// -----------------------------
const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const storage = new sdk.Storage(client);

// -----------------------------
// Utils
// -----------------------------
const getFileViewUrl = (fileId, bucket = BUCKET_ID) => {
  // Use environment-agnostic URL construction
  const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.APPWRITE_PROJECT_ID;
  
  console.log(`[getFileViewUrl] Environment variables:`, {
    endpoint,
    projectId,
    bucket,
    fileId
  });
  
  if (!projectId) {
    console.error("[Appwrite] Missing APPWRITE_PROJECT_ID environment variable");
    return "";
  }
  
  const url = `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view?project=${projectId}`;
  console.log(`[getFileViewUrl] Generated URL:`, url);
  
  return url;
};

const getFileDownloadUrl = (fileId, bucket = BUCKET_ID) => {
  // Use environment-agnostic URL construction
  const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.APPWRITE_PROJECT_ID;
  
  if (!projectId) {
    console.error("[Appwrite] Missing APPWRITE_PROJECT_ID environment variable");
    return "";
  }
  
  return `${endpoint}/storage/buckets/${bucket}/files/${fileId}/download?project=${projectId}`;
};

const restHeaders = (extra = {}) => ({
  ...extra,
  "X-Appwrite-Project": PROJECT_ID,
  "X-Appwrite-Key": APPWRITE_API_KEY,
});

const ensureTempDir = () => {
  const dir = path.join(__dirname, "..", "temp");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// Cache bucket existence to avoid repeated API calls
let _bucketChecked = false;

async function ensureBucketExists(bucketId = BUCKET_ID) {
  if (_bucketChecked) return;
  try {
    await storage.getBucket(bucketId);
    _bucketChecked = true;
  } catch (err) {
    const type = err?.type || err?.response?.data?.type;
    if (type === "storage_bucket_not_found" || err?.code === 404) {
      throw new Error(
        `[Appwrite] Storage bucket not found: "${bucketId}". Create it in Console → Storage → Buckets and use its *ID* (not the name).`
      );
    }
    // Other error (permissions/network)
    throw new Error(
      `[Appwrite] Could not validate bucket "${bucketId}": ${
        err?.message || "Unknown error"
      }`
    );
  }
}

// Optional processing helper (images/videos)
async function processBufferByMime(buffer, filename, mimetype) {
  if (!buffer) return buffer;
  if (mimetype?.startsWith("video/")) {
    return processVideo(buffer, filename);
  }
  if (mimetype?.startsWith("image/")) {
    return compressImage(buffer);
  }
  return buffer;
}

// -----------------------------
// saveFile (from disk path)
// -----------------------------
// For cases where you've already written a file to disk and want to upload it.
async function saveFile(file /* not used */, filePath, folder = BUCKET_ID) {
  await ensureBucketExists(folder);
  if (!filePath) {
    return { public_id: "", file_link: "" };
  }

  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;
  const originalname = path.basename(filePath);
  const mimetype = undefined; // If you know it, pass it in via a different signature.

  try {
    // Read file into memory (so we can use same REST flow as buffers)
    const buffer = fs.readFileSync(filePath);
    const processedBuffer = await processBufferByMime(
      buffer,
      originalname,
      mimetype
    );

    const form = new FormData();
    form.append("file", processedBuffer, {
      filename: originalname,
      contentType: mimetype,
      knownLength: processedBuffer.length,
    });
    form.append("fileId", "unique()");
    form.append("permissions[]", 'read("any")');

    const url = `${ENDPOINT}/storage/buckets/${bucket}/files`;
    const resp = await axios.post(url, form, {
      headers: restHeaders(form.getHeaders()),
    });

    // Clean up local file after upload (best-effort)
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}

    const fileUrl = getFileViewUrl(resp.data.$id, bucket);
    console.log(`[saveFile] Generated URL for ${originalname}:`, fileUrl);
    
    return {
      public_id: resp.data.$id,
      file_link: fileUrl,
    };
  } catch (error) {
    console.error(
      "[saveFile] Upload error:",
      error?.response?.data || error?.message || error
    );
    // Do not throw to avoid breaking legacy callers; return empty object
    return { public_id: "", file_link: "" };
  }
}

// -----------------------------
// uploadSingleFileToCloudinary (buffer → Appwrite)
// -----------------------------
async function uploadSingleFileToCloudinary(file, folder = BUCKET_ID) {
  await ensureBucketExists(folder);
  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;

  if (!file) return { public_id: "", file_link: "" };

  try {
    const processedBuffer = await processBufferByMime(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const form = new FormData();
    form.append("file", processedBuffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      knownLength: processedBuffer.length,
    });
    form.append("fileId", "unique()");
    form.append("permissions[]", 'read("any")');

    const url = `${ENDPOINT}/storage/buckets/${bucket}/files`;
    const resp = await axios.post(url, form, {
      headers: restHeaders(form.getHeaders()),
    });

    const fileUrl = getFileViewUrl(resp.data.$id, bucket);
    console.log(`[uploadSingleFileToAppwrite] Generated URL for ${file.originalname}:`, fileUrl);

    return {
      public_id: resp.data.$id,
      file_link: fileUrl,
    };
  } catch (error) {
    console.error(
      "[uploadSingleFileToAppwrite] Error:",
      error?.response?.data || error?.message || error
    );
    return { public_id: "", file_link: "" };
  }
}

// -----------------------------
// uploadManyFilesToCloudinary (buffers → Appwrite)
// -----------------------------
async function uploadManyFilesToCloudinary(files, folder = BUCKET_ID) {
  console.log("[uploader] Uploading %d files to appwrite", files.length);
  await ensureBucketExists(folder);
  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;
  if (!files || files.length === 0) return [];

  const url = `${ENDPOINT}/storage/buckets/${bucket}/files`;

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const processedBuffer = await processBufferByMime(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        const form = new FormData();
        form.append("file", processedBuffer, {
          filename: file.originalname,
          contentType: file.mimetype,
          knownLength: processedBuffer.length,
        });
        form.append("fileId", "unique()");
        form.append("permissions[]", 'read("any")');

        const resp = await axios.post(url, form, {
          headers: restHeaders(form.getHeaders()),
        });

        const fileUrl = getFileViewUrl(resp.data.$id, bucket);
        console.log(`[uploadManyFilesToAppwrite] Generated URL for ${file.originalname}:`, fileUrl);
        
        return {
          public_id: resp.data.$id,
          file_link: fileUrl,
          filename: file.originalname,
        };
      } catch (error) {
        console.error(
          `[uploadManyFilesToAppwrite] Error uploading ${file.originalname}:`,
          error?.response?.data || error?.message || error
        );
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
async function deleteFile(publicId, folder = BUCKET_ID) {
  await ensureBucketExists(folder);
  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;

  try {
    await storage.deleteFile(bucket, publicId);
    return { public_id: publicId, deleted: true };
  } catch (error) {
    console.error(
      "[deleteFile] Error:",
      error?.response?.data || error?.message || error
    );
    return { public_id: publicId, deleted: false };
  }
}

// -----------------------------
// deleteManyFiles
// -----------------------------
async function deleteManyFiles(publicIds, folder = BUCKET_ID) {
  await ensureBucketExists(folder);
  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;

  if (!publicIds || publicIds.length === 0) return [];

  const results = await Promise.all(
    publicIds.map(async (id) => {
      if (!id) return { public_id: id, deleted: false };
      try {
        await storage.deleteFile(bucket, id);
        return { public_id: id, deleted: true };
      } catch (error) {
        console.error(
          `[deleteManyFiles] Error deleting ${id}:`,
          error?.message || error
        );
        return { public_id: id, deleted: false };
      }
    })
  );
  return results;
}

// -----------------------------
// updateFile (disk path flow)
// -----------------------------
async function updateFile(
  publicId,
  file /* not used */,
  filePath,
  folder = BUCKET_ID
) {
  await deleteFile(publicId, folder);
  return await saveFile(null, filePath, folder);
}

// -----------------------------
// updateSingleFileToCloudinary (buffer flow)
// -----------------------------
async function updateSingleFileToCloudinary(
  publicId,
  file,
  folder = BUCKET_ID
) {
  await deleteFile(publicId, folder);
  return await uploadSingleFileToCloudinary(file, folder);
}

// -----------------------------
// updateManyFileToCloudinary
// -----------------------------
async function updateManyFileToCloudinary(
  publicIds,
  files,
  folder = BUCKET_ID
) {
  if (publicIds && publicIds.length > 0) {
    await deleteManyFiles(publicIds, folder);
  }
  return await uploadManyFilesToCloudinary(files, folder);
}

// -----------------------------
// downloadFile (returns direct download URL string)
// -----------------------------
const downloadFile = async (publicId, folder = BUCKET_ID) => {
  await ensureBucketExists(folder);
  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;

  // Either use SDK to fetch a signed URL, or return static URL:
  // Using static URL here (works if permissions allow public read)
  return getFileDownloadUrl(publicId, bucket);
};

// -----------------------------
// previewFile (returns direct view URL string)
// -----------------------------
function previewFile(publicId, folder = BUCKET_ID) {
  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;
  return getFileViewUrl(publicId, bucket);
}

module.exports = {
  saveFile,
  uploadSingleFileToCloudinary,
  updateSingleFileToCloudinary,
  uploadManyFilesToCloudinary,
  updateManyFileToCloudinary,
  deleteFile,
  deleteManyFiles,
  updateFile,
  downloadFile,
  previewFile,
};
