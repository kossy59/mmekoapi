const cloudinary = require('cloudinary').v2;
// const fs = require('fs');
const fs = require('fs').promises;

// Configure Cloudinary
// cloudinary.config({
//   cloud_name: "dvqhr7kog",
//   api_key: "212257242557771",
//   api_secret: "R0h8IvRaz6UMpoxb5_iR0jUmtDQ"
// });

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

  console.log("Cloudinary result: ",  result);

  // fs.unlinkSync(filePath); // Delete the local temp file after upload
  await fs.unlink(filePath); // Delete the local temp file after upload

  // Ensure public_id is returned in the response for internal use later
  // And file_link for displaying the uploaded file
  return { 
    public_id: result.public_id,
    file_link: result.secure_url,
  };
};


// Delete Image
const deleteFile = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "auto",
  });
  return result;
};

// Update Image
const updateFile = async (publicId, file, filePath, folder = "assets") => {
  // Delete the old image
  await deleteFile(publicId);
  // Upload the new image
  return await saveFile(file, filePath, folder);
};

// Generate download URL
const downloadFile = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
  });
};

module.exports = {
  saveFile,
  deleteFile,
  updateFile,
  downloadFile,
};
