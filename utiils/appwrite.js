const sdk = require("node-appwrite");
const { InputFile } = require("node-appwrite");
const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const { processVideo, compressImage } = require("./compress");

const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "668f9f8c0011a761d118"; // Set your project id
const APPWRITE_API_KEY =
  process.env.APPWRITE_API_KEY ||
  "standard_fbd7281db90f58951bb0ca146bfa7cc47c4307892be077e95a7d16983a006e694428a355ce72ea99fea67a0e204f227f193f2f8c401c142424dbf6ff6a831348aabbb281a502bc1f8ea116f95b0d2ecf16ee5dc8d4e003855073d9cbfd4ac3ddbdc7623e1946163ad65b46f1a75757846e74cda7a4ac91fd6e026fe637c32ab2";

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const storage = new sdk.Storage(client);
// Bucket ID: set via env var to avoid 404 bucket not found
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || "68a1daf0002128242c30"; // Your actual bucket ID
console.log("[DEBUG] Using BUCKET_ID:", BUCKET_ID, "from env:", process.env.APPWRITE_BUCKET_ID);

function getFileViewUrl(fileId, folder = BUCKET_ID) {
  return `https://cloud.appwrite.io/v1/storage/buckets/${folder}/files/${fileId}/view?project=${PROJECT_ID}`;
}

// Ensure temp directory exists
const ensureTempDir = () => {
  const tempDir = path.join(__dirname, "..", "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log("[ensureTempDir] Created temp dir:", tempDir);
  } else {
    console.log("[ensureTempDir] Temp dir exists:", tempDir);
  }
  return tempDir;
};

// Build an Appwrite-compatible file payload across SDK versions
function toAppwriteFile(buffer, filename) {
  try {
    if (InputFile && typeof InputFile.fromBuffer === "function") {
      console.log("[toAppwriteFile] Using InputFile.fromBuffer (node-appwrite)");
      return InputFile.fromBuffer(buffer, filename);
    }
    if (InputFile && typeof InputFile.fromStream === "function") {
      console.log("[toAppwriteFile] Using InputFile.fromStream (node-appwrite)");
      const readable = Readable.from(buffer);
      return InputFile.fromStream(readable, filename, buffer.length);
    }
  } catch (_) {}
  try {
    if (sdk.InputFile && typeof sdk.InputFile.fromBuffer === "function") {
      console.log("[toAppwriteFile] Using sdk.InputFile.fromBuffer");
      return sdk.InputFile.fromBuffer(buffer, filename);
    }
    if (sdk.InputFile && typeof sdk.InputFile.fromStream === "function") {
      console.log("[toAppwriteFile] Using sdk.InputFile.fromStream");
      const readable = Readable.from(buffer);
      return sdk.InputFile.fromStream(readable, filename, buffer.length);
    }
  } catch (_) {}

  // Fallback: write to temp file and return a read stream
  const tempDir = ensureTempDir();
  const tempFilePath = path.join(tempDir, `${Date.now()}-${filename}`);
  fs.writeFileSync(tempFilePath, buffer);
  const stream = fs.createReadStream(tempFilePath);
  // If InputFile.fromStream exists, prefer wrapping the fs stream with size
  try {
    const size = fs.statSync(tempFilePath).size;
    if (InputFile && typeof InputFile.fromStream === "function") {
      console.log("[toAppwriteFile] Fallback: InputFile.fromStream with fs stream");
      const payload = InputFile.fromStream(stream, filename, size);
      stream.on("close", () => {
        fs.promises.rm(tempFilePath, { force: true }).catch(() => {});
      });
      return payload;
    }
    if (sdk.InputFile && typeof sdk.InputFile.fromStream === "function") {
      console.log("[toAppwriteFile] Fallback: sdk.InputFile.fromStream with fs stream");
      const payload = sdk.InputFile.fromStream(stream, filename, size);
      stream.on("close", () => {
        fs.promises.rm(tempFilePath, { force: true }).catch(() => {});
      });
      return payload;
    }
  } catch (_) {}
  // best-effort cleanup when stream closes
  stream.on("close", () => {
    fs.promises.rm(tempFilePath, { force: true }).catch(() => {});
  });
  console.log("[toAppwriteFile] Final fallback: raw fs stream payload");
  return stream;
}

// Save Image
async function saveFile(file, filePath, folder = BUCKET_ID) {
  console.log(
    "[saveFile] Called with file:",
    file ? file.originalname : null,
    "filePath:",
    filePath,
    "folder:",
    folder
  );
  if (!file) {
    console.log("[saveFile] No file provided.");
    return {
      public_id: "",
      file_link: "",
    };
  }

  const tempDir = ensureTempDir();
  const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

  try {
    const response = await storage.createFile(
      folder,
      sdk.ID.unique(),
      processedBuffer,
      [sdk.Permission.read(sdk.Role.any())],
      [sdk.Permission.write(sdk.Role.user())]
    );

    fs.unlinkSync(tempFilePath);

    return {
      public_id: response.$id,
      file_link: getFileViewUrl(response.$id, folder),
    };
  } catch (error) {
    console.log("[saveFile] Error:", error);
    // if (fs.existsSync(tempFilePath)) {
    //   fs.unlinkSync(tempFilePath);
    // }
    return {
      public_id: "",
      file_link: "",
    };
  }
}

async function uploadSingleFileToCloudinary(file, folder = BUCKET_ID) {
  console.log(
    "[uploadSingleFileToAppwrite] Called with file:",
    file ? file.originalname : null,
    "folder:",
    folder
  );

  if (!file) {
    console.log("[uploadSingleFileToAppwrite] No file provided.");
    return { public_id: "", file_link: "" };
  }

  // const tempDir = ensureTempDir();
  // const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

  try {
    // Log buffer info
    console.log(
      "[DEBUG] Buffer type:",
      typeof file.buffer,
      "length:",
      file.buffer ? file.buffer.length : "undefined"
    );
    // console.log("[DEBUG] Writing to:", tempFilePath);

    // Write file asynchronously
    // await fs.promises.writeFile(tempFilePath, file.buffer);

    // Confirm file exists and log size
    // const exists = fs.existsSync(tempFilePath);
    // const size = exists ? fs.statSync(tempFilePath).size : 0;
    // console.log("[DEBUG] File exists after write:", exists, "Size:", size);

    // List temp dir contents
    // console.log("[DEBUG] Temp dir contents:", fs.readdirSync(tempDir));

    // Prepare processed buffer and temp path
    let processedBuffer = file.buffer;

    if (file.mimetype.startsWith("video/")) {
      console.log("Processing video...");
      processedBuffer = await processVideo(file.buffer, file.originalname);
    } else if (file.mimetype.startsWith("image/")) {
      console.log("Compressing image...");
      processedBuffer = await compressImage(file.buffer);
    }

    // Build REST multipart form-data
    const form = new FormData();
    form.append("file", processedBuffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      knownLength: processedBuffer.length,
    });
    // Appwrite REST requires a fileId; use 'unique()' to auto-generate
    form.append("fileId", "unique()");
    // Make file publicly readable (optional) to allow direct viewing
    form.append("permissions[]", 'read("any")');

    // Resolve bucket (ignore 'default' from routes and fallback to BUCKET_ID)
    const bucket = folder && folder !== "default" ? folder : BUCKET_ID;
   
    const url = `${ENDPOINT}/storage/buckets/${bucket}/files`;
    console.log("[DEBUG] Upload URL (single):", url);
    console.log("[DEBUG] Using PROJECT_ID:", PROJECT_ID);
    const headers = {
      ...form.getHeaders(),
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": APPWRITE_API_KEY,
    };
    const resp = await axios.post(url, form, { headers });

    return {
      public_id: resp.data.$id,
      file_link: getFileViewUrl(resp.data.$id, bucket),
    };
  } catch (error) {
    console.log("[uploadSingleFileToAppwrite] Error writing file:", error?.response?.data || error?.message || error);
    return { public_id: "", file_link: "" };
  }
}

async function uploadManyFilesToCloudinary(files, folder = BUCKET_ID) {
  console.log(
    "[uploadManyFilesToAppwrite] Called with files:",
    files ? files.map((f) => f.originalname) : null,
    "folder:",
    folder
  );
  // const tempDir = ensureTempDir();
  try {
    const bucket = folder && folder !== "default" ? folder : BUCKET_ID;
    console.log("[DEBUG] Using bucket for many uploads:", bucket);
    const uploadPromises = files.map(async (file) => {
      // const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
      try {
        let processedBuffer = file.buffer;

        if (file.mimetype.startsWith("video/")) {
          console.log("Processing video...");
          processedBuffer = await processVideo(file.buffer, file.originalname);
        } else if (file.mimetype.startsWith("image/")) {
          console.log("Compressing image...");
          processedBuffer = await compressImage(file.buffer);
        }

        // Build REST multipart per file
        const form = new FormData();
        form.append("file", processedBuffer, {
          filename: file.originalname,
          contentType: file.mimetype,
          knownLength: processedBuffer.length,
        });
        // Appwrite REST requires a fileId; use 'unique()' to auto-generate
        form.append("fileId", "unique()");
        // Make file publicly readable (optional) to allow direct viewing
        form.append("permissions[]", 'read("any")');
        const url = `${ENDPOINT}/storage/buckets/${bucket}/files`;
        console.log("[DEBUG] Upload URL (many):", url);
        console.log("[DEBUG] Using PROJECT_ID:", PROJECT_ID);
        const headers = {
          ...form.getHeaders(),
          "X-Appwrite-Project": PROJECT_ID,
          "X-Appwrite-Key": APPWRITE_API_KEY,
        };
        const resp = await axios.post(url, form, { headers });

        return {
          public_id: resp.data.$id,
          file_link: getFileViewUrl(resp.data.$id, bucket),
          filename: file.fieldname,
        };
      } catch (error) {
        console.log(
          `[uploadManyFilesToAppwrite] Error uploading file: ${file.originalname}`,
          error?.response?.data || error?.message || error
        );
        // if (fs.existsSync(tempFilePath)) {
        //   fs.unlinkSync(tempFilePath);
        // }
        return {
          public_id: "",
          file_link: "",
          filename: file.fieldname,
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.log("[uploadManyFilesToAppwrite] Error:", error);
    return [];
  }
}

// Delete Image
async function deleteFile(publicId, folder = BUCKET_ID) {
  console.log("[deleteFile] Called with publicId:", publicId);
  try {
    await storage.deleteFile(folder, publicId);
    console.log("[deleteFile] File deleted:", publicId);
    return { public_id: publicId, deleted: true };
  } catch (error) {
    console.log("[deleteFile] Error deleting file:", error);
    return { public_id: publicId, deleted: false };
  }
}

async function deleteManyFiles(publicIds, folder) {
  console.log("[deleteManyFiles] Called with publicIds:", publicIds);
  try {
    const deletePromises = publicIds.map(async (publicId) => {
      try {
        await storage.deleteFile(folder, publicId);
        console.log(`[deleteManyFiles] File deleted: ${publicId}`);
        return { public_id: publicId, deleted: true };
      } catch (error) {
        console.log(
          `[deleteManyFiles] Error deleting file: ${publicId}`,
          error
        );
        return { public_id: publicId, deleted: false };
      }
    });
    const results = await Promise.all(deletePromises);
    console.log("[deleteManyFiles] All deletions complete. Results:", results);
    return results;
  } catch (error) {
    console.log("[deleteManyFiles] Error:", error);
    return [];
  }
}

// Update Image
async function updateFile(publicId, file, filePath, folder = BUCKET_ID) {
  console.log(
    "[updateFile] Called with publicId:",
    publicId,
    "file:",
    file ? file.originalname : null,
    "filePath:",
    filePath,
    "folder:",
    folder
  );
  await deleteFile(publicId, folder);
  return await saveFile(file, filePath, folder);
}

async function updateSingleFileToCloudinary(
  publicId,
  file,
  folder = BUCKET_ID
) {
  console.log(
    "[updateSingleFileToAppwrite] Called with publicId:",
    publicId,
    "file:",
    file ? file.originalname : null,
    "folder:",
    folder
  );
  await deleteFile(publicId, folder);
  return await uploadSingleFileToCloudinary(file, folder);
}

async function updateManyFileToCloudinary(
  publicIds,
  files,
  folder = BUCKET_ID
) {
  console.log(
    "[updateManyFileToAppwrite] Called with publicIds:",
    publicIds,
    "files:",
    files ? files.map((f) => f.originalname) : null,
    "folder:",
    folder
  );
  if (publicIds.length > 0) {
    await deleteManyFiles(publicIds, folder);
  }
  return await uploadManyFilesToCloudinary(files, folder);
}

// Generate download URL
const downloadFile = (publicId) => {
  console.log("[downloadFile] Called with publicId:", publicId);
  // Returns a URL to download the file
  // Note: getFileDownload returns a promise, so you should handle it as async
  return storage
    .getFileDownload(BUCKET_ID, publicId)
    .then((response) => {
      console.log("[downloadFile] Download URL generated:", response.href);
      return response.href;
    })
    .catch((error) => {
      console.log("[downloadFile] Error generating download URL:", error);
      return "";
    });
};

function previewFile(publicId, folder) {
  const bucket = folder && folder !== "default" ? folder : BUCKET_ID;
  console.log("[previewFile] Called with publicId:", publicId);
  // Return a direct view URL (no image transformations)
  const url = getFileViewUrl(publicId, bucket);
  console.log("[previewFile] View URL:", url);
  return Promise.resolve(url);
}

module.exports = {
  saveFile,
  uploadSingleFileToCloudinary,
  updateSingleFileToCloudinary,
  uploadManyFilesToCloudinary,
  updateManyFileToCloudinary,
  deleteFile,
  updateFile,
  downloadFile,
  previewFile,
};
