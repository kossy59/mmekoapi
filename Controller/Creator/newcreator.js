const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
const { uploadManyFilesToCloudinary } = require("../../utiils/appwrite");

const createCreator = async (req, res) => {
  const data = req.body;

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

  // Require files for all users, regardless of exclusive_verify status
  if (!filesCount && !photolink.length) {
    return res.status(400).json({
      ok: false,
      message: "No files uploaded. Please attach at least one image file.",
    });
  }

  // Upload new files - always upload if files are provided
  const results = (req.files && req.files.length > 0)
    ? (await uploadManyFilesToCloudinary(req.files)) || []
    : [];

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

  // Require successful file upload for all users
  if (!creatorfiles.length) {
    return res.status(400).json({
      ok: false,
      message: "File upload failed. Please try again with valid image files.",
    });
  }

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