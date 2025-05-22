const { Client, Storage, ID } = require("appwrite");

// Appwrite client setup
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("668f9f8c0011a761d118");

const storage = new Storage(client);
const DEFAULT_BUCKET = "files";

// Save Image
const saveFile = async (file, filePath, bucket = DEFAULT_BUCKET) => {
  // file: multer file object, filePath: not used in Appwrite, bucket: Appwrite bucket ID
  if (!file) {
    return {
      public_id: "",
      file_link: "",
    };
  }
  const response = await storage.createFile(bucket, ID.unique(), file.buffer, file.mimetype);
  const file_link = `${client.endpoint}/storage/buckets/${bucket}/files/${response.$id}/view?project=${client.config.project}`;
  return {
    public_id: response.$id,
    file_link,
  };
};

const uploadSingleFileToAppwrite = async (file, bucket = DEFAULT_BUCKET) => {
  if (!file) {
    return {
      public_id: "",
      file_link: "",
    };
  }
  const response = await storage.createFile(bucket, ID.unique(), file.buffer, file.mimetype);
  const file_link = `${client.endpoint}/storage/buckets/${bucket}/files/${response.$id}/view?project=${client.config.project}`;
  return {
    public_id: response.$id,
    file_link,
  };
};

const uploadManyFilesToAppwrite = async (files, bucket = DEFAULT_BUCKET) => {
  if (!files || !Array.isArray(files)) return [];
  const uploadPromises = files.map(async (file) => {
    const response = await storage.createFile(bucket, ID.unique(), file.buffer, file.mimetype);
    const file_link = `${client.endpoint}/storage/buckets/${bucket}/files/${response.$id}/view?project=${client.config.project}`;
    return {
      public_id: response.$id,
      file_link,
      filename: file.fieldname,
    };
  });
  return await Promise.all(uploadPromises);
};

const deleteFile = async (publicId, bucket = DEFAULT_BUCKET) => {
  try {
    return await storage.deleteFile(bucket, publicId);
  } catch (error) {
    console.log("An error occurred while deleting your file from Appwrite: ", error);
  }
};

const deleteManyFiles = async (publicIds, bucket = DEFAULT_BUCKET) => {
  if (!publicIds || !Array.isArray(publicIds)) return [];
  const deletePromises = publicIds.map(async (publicId) => {
    return await deleteFile(publicId, bucket);
  });
  return await Promise.all(deletePromises);
};

const updateFile = async (publicId, file, filePath, bucket = DEFAULT_BUCKET) => {
  await deleteFile(publicId, bucket);
  return await saveFile(file, filePath, bucket);
};

const updateSingleFileToAppwrite = async (publicId, file, bucket = DEFAULT_BUCKET) => {
  await deleteFile(publicId, bucket);
  return await uploadSingleFileToAppwrite(file, bucket);
};

const updateManyFileToAppwrite = async (publicIds, files, bucket = DEFAULT_BUCKET) => {
  if (publicIds.length > 0) {
    await deleteManyFiles(publicIds, bucket);
  }
  return await uploadManyFilesToAppwrite(files, bucket);
};

const downloadFile = (publicId, bucket = DEFAULT_BUCKET) => {
  return `${client.endpoint}/storage/buckets/${bucket}/files/${publicId}/download?project=${client.config.project}`;
};

module.exports = {
  saveFile,
  uploadSingleFileToAppwrite,
  updateSingleFileToAppwrite,
  uploadManyFilesToAppwrite,
  updateManyFileToAppwrite,
  deleteFile,
  updateFile,
  downloadFile,
};
