const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
const { uploadManyFilesToCloudinary } = require("../../utiils/appwrite");

const createCreator = async (req, res) => {
  console.log("🔥 [createCreator] Function called - starting");
  console.log("req.body.data", req.body.data);
  const data = req.body;
  console.log("data", data);

  const userid = data.userid;
  const name = data.name;
  const age = data.age;
  const location = data.location;
  const price = data.price;
  const duration = data.duration;
  const bodytype = data.bodytype;
  const smoke = data.smoke;
  const interestedin = data.interestedin;
  const height = data.height;
  const weight = data.weight;
  const description = data.description;
  const gender = data.gender;
  const timeava = data.timeava;
  const daysava = data.daysava;
  const drink = data.drink;
  const hosttype = data.hosttype;
  const photolink = data.photolink || [];

  if (!userid) {
    return res.status(400).json({
      ok: false,
      message: "user Id invalid!!",
    });
  }

  console.log("ontop checking user");

  let currentuser = await userdb.findOne({ _id: userid }).exec();

  if (!currentuser) {
    console.log("User failed ");
    return res.status(409).json({
      ok: false,
      message: `User can not create creator`,
    });
  }

  /**
   * Validate incoming files and upload using in-memory buffers
   */
  const filesCount = Array.isArray(req.files) ? req.files.length : 0;
  console.log("[createCreator] Incoming files count:", filesCount);
  console.log("[createCreator] req.files:", req.files);
  console.log("[createCreator] req.files details:", req.files?.map(f => ({
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    fieldname: f.fieldname
  })));
  console.log("[createCreator] photolink from data:", photolink);

  if (!filesCount && !currentuser?.exclusive_verify && !photolink.length) {
    return res.status(400).json({
      ok: false,
      message: "No files uploaded. Please attach at least one image file.",
    });
  }

  // Upload new files if not exclusive
  console.log("[createCreator] About to upload files:", req.files?.map(f => f.originalname));
  const results = currentuser?.exclusive_verify
    ? []
    : (await uploadManyFilesToCloudinary(req.files)) || [];

  console.log("[createCreator] Upload results:", results);
  console.log("Uploader succeeded");

  // Merge uploaded files with any photolinks passed from frontend
  const uploadedFiles = results
    .filter((result) => result && result.public_id && result.file_link)
    .map((result) => ({
      creatorfilelink: result.file_link,
      creatorfilepublicid: result.public_id,
    }));

  // Only use photolinks from request if no files were uploaded
  let creatorfiles = uploadedFiles;
  
  if (uploadedFiles.length === 0 && photolink.length > 0) {
    const photolinksFromReq = photolink.map((link) => ({
      creatorfilelink: link,
      creatorfilepublicid: null,
    }));
    creatorfiles = photolinksFromReq;
  }

  if (!creatorfiles.length && !currentuser?.exclusive_verify) {
    return res.status(400).json({
      ok: false,
      message: "File upload failed. Please try again with valid image files.",
    });
  }

  console.log("creatorfiles: ", creatorfiles);

  try {
    const creator = {
      userid,
      creatorfiles,
      verify: currentuser?.exclusive_verify ? "live" : "unverified",
      name,
      age,
      location,
      price,
      duration,
      bodytype,
      smoke,
      drink,
      interestedin,
      height,
      weight,
      description,
      gender,
      timeava,
      daysava,
      hosttype,
    };

    console.log("Creating creator with: ", creator);

    const newCreator = await creators.create(creator);

    await currentuser
      .updateOne({
        creator_portfolio: true,
        creatorId: newCreator._id,
        creatorID: newCreator._id,
      })
      .exec();

    await currentuser.save();

    return res.status(200).json({
      ok: true,
      message: `Creator hosted successfully`,
      id: newCreator._id,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createCreator;