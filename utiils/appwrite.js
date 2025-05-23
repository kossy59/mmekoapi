const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("668f9f8c0011a761d118")
  .setKey("standard_fbd7281db90f58951bb0ca146bfa7cc47c4307892be077e95a7d16983a006e694428a355ce72ea99fea67a0e204f227f193f2f8c401c142424dbf6ff6a831348aabbb281a502bc1f8ea116f95b0d2ecf16ee5dc8d4e003855073d9cbfd4ac3ddbdc7623e1946163ad65b46f1a75757846e74cda7a4ac91fd6e026fe637c32ab2");

const storage = new sdk.Storage(client);
const id = new sdk.ID();

const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || "default"; // Set your bucket id

// Save Image
const saveFile = async (file, filePath, folder = "assets") => {
  console.log("[saveFile] Called with file:", file ? file.originalname : null, "filePath:", filePath, "folder:", folder);
  if (!file) {
    console.log("[saveFile] No file provided.");
    return {
      public_id: "",
      file_link: "",
    };
  }

  try {
    console.log("[saveFile] Attempting to create file in Appwrite...");
    const response = await storage.createFile(
      BUCKET_ID,
      id.unique(),
      file.buffer,
      [sdk.Permission.read(sdk.Role.any())],   // Public read
      [sdk.Permission.write(sdk.Role.any())]   // Public write (anyone can upload)
    );
    console.log("[saveFile] File created. Response:", response);

    return {
      public_id: response.$id,
      file_link: response.$id, // Use downloadFile to get URL
    };
  } catch (error) {
    console.log("[saveFile] Error:", error);
    return {
      public_id: "",
      file_link: "",
    };
  }
};

const uploadSingleFileToCloudinary = async (file, folder = "assets") => {
  console.log("[uploadSingleFileToCloudinary] Called with file:", file ? file.originalname : null, "folder:", folder);
  if (!file) {
    console.log("[uploadSingleFileToCloudinary] No file provided.");
    return {
      public_id: "",
      file_link: "",
    };
  }

  try {
    console.log("[uploadSingleFileToCloudinary] Attempting to create file in Appwrite...");
    const response = await storage.createFile(
      BUCKET_ID,
      id.unique(),
      file.buffer,
      [sdk.Permission.read(sdk.Role.any())],
      [sdk.Permission.write(sdk.Role.any())]
    );
    console.log("[uploadSingleFileToCloudinary] File created. Response:", response);

    return {
      public_id: response.$id,
      file_link: response.$id,
    };
  } catch (error) {
    console.log("[uploadSingleFileToCloudinary] Error:", error);
    return {
      public_id: "",
      file_link: "",
    };
  }
};

const uploadManyFilesToCloudinary = async (files, folder = "assets") => {
  console.log("[uploadManyFilesToCloudinary] Called with files:", files ? files.map(f => f.originalname) : null, "folder:", folder);
  try {
    const uploadPromises = files.map(async (file) => {
      console.log(`[uploadManyFilesToCloudinary] Uploading file: ${file.originalname}`);
      try {
        const response = await storage.createFile(
          BUCKET_ID,
          id.unique(),
          file.buffer,
          [sdk.Permission.read(sdk.Role.any())],
          [sdk.Permission.write(sdk.Role.any())]
        );
        console.log(`[uploadManyFilesToCloudinary] File uploaded: ${file.originalname}, Response:`, response);
        return {
          public_id: response.$id,
          file_link: response.$id,
          filename: file.fieldname,
        };
      } catch (error) {
        console.log(`[uploadManyFilesToCloudinary] Error uploading file: ${file.originalname}`, error);
        return {
          public_id: "",
          file_link: "",
          filename: file.fieldname,
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    console.log("[uploadManyFilesToCloudinary] All uploads complete. Results:", results);
    return results;
  } catch (error) {
    console.log("[uploadManyFilesToCloudinary] Error:", error);
    return [];
  }
};

// Delete Image
const deleteFile = async (publicId) => {
  console.log("[deleteFile] Called with publicId:", publicId);
  try {
    await storage.deleteFile(BUCKET_ID, publicId);
    console.log("[deleteFile] File deleted:", publicId);
    return { public_id: publicId, deleted: true };
  } catch (error) {
    console.log("[deleteFile] Error deleting file:", error);
    return { public_id: publicId, deleted: false };
  }
};

const deleteManyFiles = async (publicIds) => {
  console.log("[deleteManyFiles] Called with publicIds:", publicIds);
  try {
    const deletePromises = publicIds.map(async (publicId) => {
      try {
        await storage.deleteFile(BUCKET_ID, publicId);
        console.log(`[deleteManyFiles] File deleted: ${publicId}`);
        return { public_id: publicId, deleted: true };
      } catch (error) {
        console.log(`[deleteManyFiles] Error deleting file: ${publicId}`, error);
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
};

// Update Image
const updateFile = async (publicId, file, filePath, folder = "assets") => {
  console.log("[updateFile] Called with publicId:", publicId, "file:", file ? file.originalname : null, "filePath:", filePath, "folder:", folder);
  await deleteFile(publicId);
  return await saveFile(file, filePath, folder);
};

const updateSingleFileToCloudinary = async (publicId, file, folder = "assets") => {
  console.log("[updateSingleFileToCloudinary] Called with publicId:", publicId, "file:", file ? file.originalname : null, "folder:", folder);
  await deleteFile(publicId);
  return await uploadSingleFileToCloudinary(file, folder);
};

const updateManyFileToCloudinary = async (publicIds, files, folder = "assets") => {
  console.log("[updateManyFileToCloudinary] Called with publicIds:", publicIds, "files:", files ? files.map(f => f.originalname) : null, "folder:", folder);
  if (publicIds.length > 0) {
    await deleteManyFiles(publicIds);
  }
  return await uploadManyFilesToCloudinary(files, folder);
};

// Generate download URL
const downloadFile = (publicId) => {
  console.log("[downloadFile] Called with publicId:", publicId);
  // Returns a URL to download the file
  // Note: getFileDownload returns a promise, so you should handle it as async
  return storage.getFileDownload(BUCKET_ID, publicId)
    .then(response => {
      console.log("[downloadFile] Download URL generated:", response.href);
      return response.href;
    })
    .catch(error => {
      console.log("[downloadFile] Error generating download URL:", error);
      return "";
    });
};

module.exports = {
  saveFile,
  uploadSingleFileToCloudinary,
  updateSingleFileToCloudinary,
  uploadManyFilesToCloudinary,
  updateManyFileToCloudinary,
  deleteFile,
  updateFile,
  downloadFile,
};
