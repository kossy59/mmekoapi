// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const models = require("../../Models/models");
const userdb = require("../../Models/userdb");
const { uploadManyFilesToCloudinary } = require("../../utiils/appwrite");

const createModel = async (req, res) => {
  console.log("req.body.data", req.body.data);
  const data = req.body
  console.log("data", data);

  // if (!req.files || req.files.length !== 2) {
  //   return res.status(400).json({
  //     "ok": false,
  //     'message': 'You must upload all documents'
  //   })
  // }

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

  if (!userid) {
    return res.status(400).json({
      ok: false,
      message: "user Id invalid!!",
    });
  }

  console.log("ontop checking user");

  let currentuser = await userdb
    .findOne({
      _id: userid,
    })
    .exec();

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

  if (!filesCount) {
    return res.status(400).json({
      ok: false,
      message: "No files uploaded. Please attach at least one image file.",
    });
  }

  // Use default APPWRITE_BUCKET_ID (from env) by not overriding folder
  const results = (await uploadManyFilesToCloudinary(req.files)) || [];

  console.log("Uploader Succeded, Probably");

  let modelfiles = [];

  // Clean up uploaded file for database storage, filter failed uploads
  const databaseReady = results
    .filter((result) => result && result.public_id && result.file_link)
    .map((result) => {
      return {
        modelfilelink: result.file_link,
        modelfilepublicid: result.public_id,
      };
    });
  modelfiles = databaseReady;

  if (!modelfiles.length) {
    return res.status(400).json({
      ok: false,
      message: "File upload failed. Please try again with valid image files.",
    });
  }

  console.log("modelfiles: ", modelfiles);

  //let data = await connectdatabase()

  try {
    //  let userdb = data.databar.listDocuments(data.dataid,data.colid)
    //  let currentuser = (await userdb).documents.find(value=>{
    //   return value.$id === userid
    //  })

    const model = {
      userid,
      modelfiles: databaseReady,
      verify: "live",
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

    //await data.databar.createDocument(data.dataid,data.modelCol,sdk.ID.unique(),model)

    const newModel = await models.create(model);
    await currentuser
      .updateOne({
        isModel: true,
        modelId: newModel._id,
      })
      .exec();

    return res.status(200).json({
      ok: true,
      message: `Model Hosted successfully`,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createModel;
