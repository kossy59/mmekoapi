const models = require("../../Models/models");
const userdb = require("../../Models/userdb");
const { uploadManyFilesToCloudinary } = require("../../utiils/appwrite");

const createModel = async (req, res) => {
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
      message: `User can not create model`,
    });
  }

  /**
   * Validate incoming files and upload using in-memory buffers
   */
  const filesCount = Array.isArray(req.files) ? req.files.length : 0;
  console.log("[createModel] Incoming files count:", filesCount);

  if (!filesCount && !currentuser?.exclusive_verify && !photolink.length) {
    return res.status(400).json({
      ok: false,
      message: "No files uploaded. Please attach at least one image file.",
    });
  }

  // Upload new files if not exclusive
  const results = currentuser?.exclusive_verify
    ? []
    : (await uploadManyFilesToCloudinary(req.files)) || [];

  console.log("Uploader succeeded");

  // Merge uploaded files with any photolinks passed from frontend
  const uploadedFiles = results
    .filter((result) => result && result.public_id && result.file_link)
    .map((result) => ({
      modelfilelink: result.file_link,
      modelfilepublicid: result.public_id,
    }));

  // Merge photolinks that might have been passed directly in the request
  const photolinksFromReq = photolink.map((link) => ({
    modelfilelink: link,
    modelfilepublicid: null,
  }));

  const modelfiles = [...uploadedFiles, ...photolinksFromReq];

  if (!modelfiles.length && !currentuser?.exclusive_verify) {
    return res.status(400).json({
      ok: false,
      message: "File upload failed. Please try again with valid image files.",
    });
  }

  console.log("modelfiles: ", modelfiles);

  try {
    const model = {
      userid,
      modelfiles,
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

    console.log("Creating model with: ", model);

    const newModel = await models.create(model);

    await currentuser
      .updateOne({
        isModel: true,
        modelId: newModel._id,
        modelID: newModel._id,
      })
      .exec();

    await currentuser.save();

    return res.status(200).json({
      ok: true,
      message: `Model hosted successfully`,
      id: newModel._id,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createModel;