const documentdb = require("../../Creators/document");
const admindb = require("../../Creators/admindb");
const { uploadManyFilesToCloudinary } = require("../../utiils/appwrite");

const createCreator = async (req, res) => {
  console.log("Trying to verify a form: ", req.body);
  const data = JSON.parse(req.body.data);
  console.log("data", data);

  // Validate files
  if (!req.files || req.files.length !== 2) {
    return res.status(400).json({
      ok: false,
      message: "You must upload both ID photo and holding ID photo",
    });
  }

  // Extract fields
  const {
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
  } = data;

  // Validate required fields
  if (!userid || !firstname || !lastname || !email || !dob || !country || !city || !address || !documentType || !idexpire) {
    return res.status(400).json({
      ok: false,
      message: "All fields are required",
    });
  }

  // Validate dates
  const today = new Date();
  const dobDate = new Date(dob);
  const idexpireDate = new Date(idexpire);

  if (isNaN(dobDate.getTime())) {
    return res.status(400).json({ ok: false, message: "Invalid Date of Birth" });
  }
  if (isNaN(idexpireDate.getTime())) {
    return res.status(400).json({ ok: false, message: "Invalid ID Expiration Date" });
  }
  const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  if (dobDate > minAgeDate) {
    return res.status(400).json({ ok: false, message: "You must be at least 18 years old" });
  }
  if (idexpireDate < today) {
    return res.status(400).json({ ok: false, message: "ID expiration date must be in the future" });
  }

  // Upload files to Cloudinary
  let results = await uploadManyFilesToCloudinary(req.files, `post`);
  console.log("results from cloudinary: ", results);

  let holdingIdPhotofile = {};
  let idPhotofile = {};

  // FIXED: Get the correct file mapping from FormData field names
  // The files in req.files should maintain their original field names
  if (req.files && req.files.length >= 2) {
    // Map files by their field names from FormData
    req.files.forEach((file, index) => {
      if (file.fieldname === 'holdingIdPhotofile') {
        holdingIdPhotofile = {
          holdingIdPhotofilelink: results[index].file_link,
          holdingIdPhotofilepublicid: results[index].public_id,
        };
      } else if (file.fieldname === 'idPhotofile') {
        idPhotofile = {
          idPhotofilelink: results[index].file_link,
          idPhotofilepublicid: results[index].public_id,
        };
      }
    });
  } else {
    return res.status(400).json({
      ok: false,
      message: "Network error. Retry!",
    });
  }

  // Alternative approach if the above doesn't work:
  // If req.files doesn't have fieldname, use the order from FormData
  if (Object.keys(holdingIdPhotofile).length === 0 || Object.keys(idPhotofile).length === 0) {
    console.log("Using alternative file mapping approach");
    idPhotofile = {
      idPhotofilelink: results[0].file_link,
      idPhotofilepublicid: results[0].public_id,
    };
    holdingIdPhotofile = {
      holdingIdPhotofilelink: results[1].file_link,
      holdingIdPhotofilepublicid: results[1].public_id,
    };
  }

  console.log("holdingIdPhotofile: ", holdingIdPhotofile, "idPhotofile: ", idPhotofile);

  try {
    let document = {
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
      createdAt: new Date(), // Added here
    };

    console.log("Document to be submitted: ", document);

    await documentdb.create(document);

    let respond = {
      userid,
      message: `Your Become a creator is under review`,
      seen: true,
    };

    await admindb.create(respond);

    return res.status(200).json({
      ok: true,
      message: "successfully",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createCreator;