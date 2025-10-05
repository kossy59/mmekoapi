const creators = require("../../Creators/creators");
const { updateManyFileToCloudinary } = require("../../utiils/appwrite");

const createCreator = async (req, res) => {
  // Handle data from FormData (individual fields) or JSON string
  let data;
  if (req.body.data) {
    // If data is sent as JSON string
    data = JSON.parse(req.body.data);
  } else {
    // If data is sent as individual form fields
    data = req.body;
  }

  let hostid = data.hostid;
  let age = data.age;
  let location = data.location;
  let price = data.price;
  let duration = data.duration;
  let bodytype = data.bodytype;
  let smoke = data.smoke;
  let interestedin = data.interestedin;
  let height = data.height;
  let weight = data.weight;
  let description = data.description;
  let gender = data.gender;
  let timeava = data.timeava;
  let daysava = data.daysava;
  let drink = data.drink;
  let hosttype = data.hosttype;
  let name = data.name; // Add name field
  let userId = data.userId; // Add userId field
  let creatorId = data.creatorId; // Add creatorId field

  // Handle array fields properly (FormData sends arrays as multiple fields with same name)
  if (Array.isArray(data.interestedin)) {
    interestedin = data.interestedin;
  } else if (typeof data.interestedin === 'string') {
    try {
      interestedin = JSON.parse(data.interestedin);
    } catch (e) {
      interestedin = [data.interestedin];
    }
  }

  if (Array.isArray(data.timeava)) {
    timeava = data.timeava;
  } else if (typeof data.timeava === 'string') {
    try {
      timeava = JSON.parse(data.timeava);
    } catch (e) {
      timeava = [data.timeava];
    }
  }

  if (Array.isArray(data.daysava)) {
    daysava = data.daysava;
  } else if (typeof data.daysava === 'string') {
    try {
      daysava = JSON.parse(data.daysava);
    } catch (e) {
      daysava = [data.daysava];
    }
  }
  // photolink = data.photolink

  if (!hostid) {
    return res.status(400).json({
      ok: false,
      message: "User Id invalid!!",
    });
  }

  let currentuser = await creators
    .findOne({
      userid: hostid,
    })
    .exec();

  if (!currentuser) {
    return res.status(409).json({
      ok: false,
      message: `User can not edit portfolio`,
    });
  }

  let publicIDs = [];

  if (currentuser.creatorfiles.length > 0) {
    const creatorfilepublicids = currentuser.creatorfiles.map((creatorfile) => {
      return creatorfile.creatorfilepublicid;
    });

    publicIDs = creatorfilepublicids;
  }

  /**
   * This implementation allows for in memory file upload manipulation
   * This prevents accessing the filesystem of the hosted server
   */
  let results = [];

  if (req.files || req.files.length > 2) {
    results = await updateManyFileToCloudinary(publicIDs, req.files, "post");
  } 

  let creatorfiles = [];

  // Clean up uploaded file for database storage
  if (results && results.length !== 0) {
    const databaseReady = results.map((result) => {
      return {
        creatorfilelink: result.file_link,
        creatorfilepublicid: result.public_id,
      };
    });
    creatorfiles = databaseReady;
  }

  //let data = await connectdatabase()

  try {
    const age1 = currentuser.age;
    const location1 = currentuser.location;
    const price1 = currentuser.price;
    const duration1 = currentuser.duration;
    const bodytype1 = currentuser.bodytype;
    const smoke1 = currentuser.smoke;
    const interestedin1 = currentuser.interestedin;
    const height1 = currentuser.height;
    const weight1 = currentuser.weight;
    const description1 = currentuser.description;
    const gender1 = currentuser.gender;
    const timeava1 = currentuser.timeava;
    const daysava1 = currentuser.daysava;
    const drink1 = currentuser.drink;
    const hosttype1 = currentuser.hosttype;
    const initialCreatorFiles = currentuser.creatorfiles;

    if (!age) {
      age = age1;
    }

    if (!location1) {
      location = location1;
    }
    if (!price) {
      price = price1;
    }
    if (!duration) {
      duration = duration1;
    }
    if (!bodytype) {
      bodytype = bodytype1;
    }
    if (!smoke) {
      smoke = smoke1;
    }
    if (!interestedin) {
      interestedin = interestedin1;
    }
    if (!height) {
      height = height1;
    }
    if (!weight) {
      weight = weight1;
    }
    if (!description) {
      description = description1;
    }
    if (!gender) {
      gender = gender1;
    }
    if (!timeava) {
      timeava = timeava1;
    }
    if (!daysava) {
      daysava = daysava1;
    }
    if (!drink) {
      drink = drink1;
    }
    if (!hosttype) {
      hosttype = hosttype1;
    }
    if (!creatorfiles) {
      currentuser.creatorfiles = initialCreatorFiles;
    }

    currentuser.name = name || currentuser.name; // Update name if provided
    currentuser.age = age;
    currentuser.location = location;
    currentuser.price = price;
    currentuser.duration = duration;
    currentuser.bodytype = bodytype;
    currentuser.smoke = smoke;
    currentuser.drink = drink;
    currentuser.interestedin = interestedin;
    currentuser.height = height;
    currentuser.weight = weight;
    currentuser.description = description;
    currentuser.gender = gender;
    currentuser.timeava = timeava;
    currentuser.daysava = daysava;
    currentuser.hosttype = hosttype;

    if (creatorfiles) {
      currentuser.creatorfiles = creatorfiles;
    }

    currentuser.save();

    // await data.databar.updateDocument(data.dataid,data.creatorCol,currentuser._id,currentuser)

    return res.status(200).json({
      ok: true,
      message: `Creator Update successfully`,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createCreator;
