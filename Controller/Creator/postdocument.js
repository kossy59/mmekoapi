const documentdb = require("../../Creators/document");
const admindb = require("../../Creators/admindb");
const { uploadManyFilesToCloudinary } = require("../../utiils/appwrite");

const createCreator = async (req, res) => {
  console.log("Trying to verify a form: ", req.body);
  const data = JSON.parse(req.body.data);
  console.log("Parsed data:", data);

  // Validate required files
  if (!req.files || Object.keys(req.files).length !== 2) {
    return res.status(400).json({
      ok: false,
      message: "You must upload both ID photo and selfie with ID",
    });
  }

  const { userid, firstname, lastname, email, dob, country, city, address, documentType, idexpire } = data;

  if (!userid || !firstname || !lastname || !email || !dob || !country || !city || !address || !documentType || !idexpire) {
    return res.status(400).json({
      ok: false,
      message: "Missing required fields!",
    });
  }

  // Upload files to Cloudinary
  let results;
  try {
    results = await uploadManyFilesToCloudinary(req.files, "post");
    console.log("Results from Cloudinary:", results);
  } catch (uploadErr) {
    console.error("Upload error:", uploadErr);
    return res.status(500).json({
      ok: false,
      message: "Failed to upload files to Cloudinary",
    });
  }

  let holdingIdPhotofile = {};
  let idPhotofile = {};

  if (results && results.length === 2) {
    results.forEach((result) => {
      if (result.filename === "holdingIdPhotofile") {
        holdingIdPhotofile = {
          holdingIdPhotofilelink: result.file_link,
          holdingIdPhotofilepublicid: result.public_id,
        };
      } else if (result.filename === "idPhotofile") {
        idPhotofile = {
          idPhotofilelink: result.file_link,
          idPhotofilepublicid: result.public_id,
        };
      }
    });
  } else {
    return res.status(400).json({
      ok: false,
      message: "Invalid file upload response from Cloudinary",
    });
  }

  console.log("holdingIdPhotofile:", holdingIdPhotofile, "idPhotofile:", idPhotofile);

  if (!holdingIdPhotofile.holdingIdPhotofilelink || !idPhotofile.idPhotofilelink) {
    return res.status(400).json({
      ok: false,
      message: "One or more photo links are missing",
    });
  }

  try {
    const document = {
      userid,
      firstname,
      lastname,
      email,
      dob,
      country,
      city,
      address,
      documentType,
      idexpire,
      holdingIdPhotofile,
      idPhotofile,
    };

    console.log("Document to be submitted:", document);

    await documentdb.create(document);

    const respond = {
      userid,
      message: `Your Become a creator is under review`,
      seen: true,
    };

    await admindb.create(respond);

    return res.status(200).json({
      ok: true,
      message: "Successfully submitted",
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createCreator;