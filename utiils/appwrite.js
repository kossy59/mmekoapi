const sdk = require("node-appwrite");
const crypto = require("crypto");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const ar = require("appwrite");
const { File } = require("buffer");

const { processVideo, compressImage } = require("./compress");

const client = new sdk.Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("668f9f8c0011a761d118")
  .setKey(
    "standard_fbd7281db90f58951bb0ca146bfa7cc47c4307892be077e95a7d16983a006e694428a355ce72ea99fea67a0e204f227f193f2f8c401c142424dbf6ff6a831348aabbb281a502bc1f8ea116f95b0d2ecf16ee5dc8d4e003855073d9cbfd4ac3ddbdc7623e1946163ad65b46f1a75757846e74cda7a4ac91fd6e026fe637c32ab2"
  );

const storage = new sdk.Storage(client);
const folder = "default"; // Set your bucket id
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "668f9f8c0011a761d118"; // Set your project id

function getFileViewUrl(fileId, folder) {
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

// Save Image
async function saveFile(file, filePath, folder = "assets") {
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

async function uploadSingleFileToCloudinary(file, folder = "assets") {
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

    // const fileStream = fs.createReadStream(tempFilePath);
    let processedBuffer = file.buffer;

    if (file.mimetype.startsWith("video/")) {
      console.log("Processing video...");
      processedBuffer = await processVideo(file.buffer, file.originalname);
    } else if (file.mimetype.startsWith("image/")) {
      console.log("Compressing image...");
      processedBuffer = await compressImage(file.buffer);
    }

    const theFile = new File([processedBuffer], file.originalname, {
      type: file.mimetype,
    });

    const response = await storage.createFile(
      folder,
      sdk.ID.unique(),
      theFile,
      [sdk.Permission.read(sdk.Role.any())],
      [sdk.Permission.write(sdk.Role.user())]
    );

    // Delete the temp file after upload
    // await fs.promises.rm(tempFilePath);

    return {
      public_id: response.$id,
      file_link: getFileViewUrl(response.$id, folder),
    };
  } catch (error) {
    console.log("[uploadSingleFileToAppwrite] Error writing file:", error);
    return { public_id: "", file_link: "" };
  }
}

async function uploadManyFilesToCloudinary(files, folder = "assets") {
  console.log(
    "[uploadManyFilesToAppwrite] Called with files:",
    files ? files.map((f) => f.originalname) : null,
    "folder:",
    folder
  );
  // const tempDir = ensureTempDir();
  try {
    const uploadPromises = files.map(async (file) => {
      // const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
      try {
        // fs.writeFileSync(tempFilePath, file.buffer);
        // const fileStream = fs.createReadStream(tempFilePath);
        let processedBuffer = file.buffer;

        if (file.mimetype.startsWith("video/")) {
          console.log("Processing video...");
          processedBuffer = await processVideo(file.buffer, file.originalname);
        } else if (file.mimetype.startsWith("image/")) {
          console.log("Compressing image...");
          processedBuffer = await compressImage(file.buffer);
        }

        const theFile = new File([processedBuffer], file.originalname, {
          type: file.mimetype,
        });

        const response = await storage.createFile(
          folder,
          sdk.ID.unique(),
          theFile,
          [sdk.Permission.read(sdk.Role.any())],
          [sdk.Permission.write(sdk.Role.user())]
        );

        // await fs.promises.rm(tempFilePath);

        return {
          public_id: response.$id,
          file_link: getFileViewUrl(response.$id, folder),
          filename: file.fieldname,
        };
      } catch (error) {
        console.log(
          `[uploadManyFilesToAppwrite] Error uploading file: ${file.originalname}`,
          error
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
async function deleteFile(publicId, folder = "default") {
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
async function updateFile(publicId, file, filePath, folder = "default") {
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
  folder = "default"
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
  folder = "default"
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
  console.log("[previewFile] Called with publicId:", publicId);
  // Returns a URL to preview the file
  return storage
    .getFilePreview(folder, publicId)
    .then((response) => {
      console.log("[previewFile] Preview URL generated:", response.href);
      return response.href;
    })
    .catch((error) => {
      console.log("[previewFile] Error generating preview URL:", error);
      return "";
    });
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
