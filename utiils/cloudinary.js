const cloudinary = require('cloudinary').v2;
// const fs = require('fs');
const fs = require('fs').promises;
// Helper function to convert buffer to stream
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Save Image
const saveFile = async (file, filePath, folder = "assets") => {
  console.log("file: ", file);
  // If user did not include any post file, return empty file metadata
  if (!file) {
    return ({
      public_id: "",
      file_link: "",
    })
  }

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "auto",
    folder,
  })

  /*// For debugging
  await cloudinary.uploader.upload(filePath, {
    // resource_type: "auto",
    folder,
  }).then(response => {
    console.log("response: ", response)
  }).catch(error => {
    console.log("Cloudinary is giving this error: ", error);
  });;*/

  console.log("Cloudinary result: ", result);

  // fs.unlinkSync(filePath); // Delete the local temp file after upload
  await fs.unlink(filePath); // Delete the local temp file after upload

  // Ensure public_id is returned in the response for internal use later
  // And file_link for displaying the uploaded file
  return {
    public_id: result.public_id,
    file_link: result.secure_url,
  };
};

const uploadSingleFileToCloudinary = async (file, folder = "assets") => {
  console.log("file: ", file);

  const result = {
    public_id: "",
    file_link: "",
  }
  // If user did not include any post file, return empty file metadata
  if (!file) {
    return result
  }

  try {
    // Try the file upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const options = {
        resource_type: "auto",
        folder,
      }
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(file.buffer).pipe(stream);
    });

    // Ensure public_id is returned in the response for internal use later
    // And file_link for displaying the uploaded file
    return {
      public_id: result.public_id,
      file_link: result.secure_url,
    };
  } catch (error) {
    console.log("An error occurred while uploading your image cloudinary: ", error);
    // return res.status(502).json({ "ok": false, 'message': 'An error occurred while uploading your file to Cloudinary' })
  }
};

const uploadManyFilesToCloudinary = async (files, folder = "assets") => {
  console.log("files: ", files);

  try {
    // Try the file upload to Cloudinary
    const uploadPromises = files.map(async (file) => {
      console.log(`Processing file: ${file.originalname} for ${file.fieldname} in ${folder}`);
      // Save file to Cloudinary
      return new Promise((resolve, reject) => {
        const options = {
          resource_type: "auto",
          folder,
        }
        // Iinitiate the upload
        cloudinary.uploader.upload_stream(options, (error, result) => {
          if (result) {
            resolve({
              public_id: result.public_id,
              file_link: result.secure_url,
              filename: file.fieldname,
            });
          } else {
            reject(error);
          }
        }).end(file.buffer);
      });
    })

    return await Promise.all(uploadPromises);

    // return uploadedFiles
  } catch (error) {
    console.log("An error occurred while uploading your image cloudinary: ", error);
    // return res.status(502).json({ "ok": false, 'message': 'An error occurred while uploading your files to cloudinary' })
  }
};

// Delete Image
const deleteFile = async (publicId) => {
  try {
    // Try the file upload to Cloudinary

    /*cloudinary.uploader.destroy('your_public_id', { resource_type: 'image', invalidate: true })
        .then(result => console.log(result))
        .catch(error => console.error(error));*/

    const result = await new Promise((resolve, reject) => {
      const options = {
        resource_type: "auto",
      }

      const result = cloudinary.uploader.destroy(publicId, (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      })

      return result;
    })
  } catch (error) {
    console.log("An error occurred while deleting your file from cloudinary: ", error);
    // return res.status(502).json({ "ok": false, 'message': 'An error occurred while deleting your file from cloudinary' })
  }
};

const deleteManyFiles = async (publicIds) => {
  try {
    // Try the file upload to Cloudinary
    const deletePromises = publicIds.map(async (publicId) => {
      console.log(`Deleting: ${publicId}`);
      // Save file to Cloudinary
      return new Promise((resolve, reject) => {
        const options = {
          resource_type: "auto",
        }
        // Iinitiate the upload
        const result = cloudinary.uploader.destroy(publicId, (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        })
      });
    })

    return await Promise.all(deletePromises);

    // return uploadedFiles
  } catch (error) {
    console.log("An error occurred while deleting your old image: ", error);
    // return res.status(502).json({ "ok": false, 'message': 'An error occurred while uploading your files to cloudinary' })
  }
};

// Update Image
const updateFile = async (publicId, file, filePath, folder = "assets") => {
  // Delete the old image
  await deleteFile(publicId);
  // Upload the new image
  return await saveFile(file, filePath, folder);
};

const updateSingleFileToCloudinary = async (publicId, file, folder = "assets") => {
  // Delete the old image
  const deletionData = await deleteFile(publicId);

  console.log("deletionData: ", deletionData);
  // Upload the new image
  return await uploadSingleFileToCloudinary(file, folder);
}

const updateManyFileToCloudinary = async (publicIds, files, folder = "assets") => {
  console.log("publicIds: ", publicIds)
  // Delete the old image
  if (publicIds.length > 0) {
    const deletionData = await deleteManyFiles(publicIds);
    console.log("deletionData: ", deletionData);
  }
  // Upload the new image
  return await uploadManyFilesToCloudinary(files, folder);
}

// Generate download URL
const downloadFile = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
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
