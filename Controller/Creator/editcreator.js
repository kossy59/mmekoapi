const creators = require("../../Creators/creators");
const { updateManyFileToCloudinary } = require("../../utiils/appwrite");

const editCreator = async (req, res) => {
  console.log("🔥 [editCreator] Function called - starting");
  console.log("🔥 [editCreator] Request details:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    bodyKeys: Object.keys(req.body || {}),
    filesCount: req.files ? req.files.length : 0
  });
  
  // Handle data from FormData (individual fields) or JSON string
  let data;
  if (req.body.data) {
    // If data is sent as JSON string
    data = JSON.parse(req.body.data);
  } else {
    // If data is sent as individual form fields
    data = req.body;
  }
  
  console.log("🔥 [editCreator] Parsed data:", data);
  console.log("🔥 [editCreator] Image data analysis:", {
    existingImages: data.existingImages,
    imagesToDelete: data.imagesToDelete,
    newFilesCount: req.files ? req.files.length : 0,
    existingImagesCount: data.existingImages ? data.existingImages.length : 0,
    imagesToDeleteCount: data.imagesToDelete ? data.imagesToDelete.length : 0
  });
  

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
  let creator_portfolio_id = data.creator_portfolio_id; // Add creator_portfolio_id field

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
    console.log("❌ [editCreator] Missing hostid");
    return res.status(400).json({
      ok: false,
      message: "User Id invalid!!",
    });
  }

  console.log("🔥 [editCreator] Looking up user:", hostid);
  let currentuser = await creators
    .findOne({
      userid: hostid,
    })
    .exec();

  if (!currentuser) {
    console.log("❌ [editCreator] User not found:", hostid);
    return res.status(409).json({
      ok: false,
      message: `User can not edit portfolio`,
    });
  }

  console.log("✅ [editCreator] User found:", {
    userId: currentuser.userid,
    name: currentuser.name,
    currentFilesCount: currentuser.creatorfiles.length
  });

  let publicIDs = [];

  if (currentuser.creatorfiles.length > 0) {
    const creatorfilepublicids = currentuser.creatorfiles.map((creatorfile) => {
      return creatorfile.creatorfilepublicid;
    });

    publicIDs = creatorfilepublicids;
  }

  console.log("🔥 [editCreator] Current user files analysis:", {
    currentFilesCount: currentuser.creatorfiles.length,
    publicIDsCount: publicIDs.length,
    newFilesToUpload: req.files ? req.files.length : 0
  });

  /**
   * This implementation allows for in memory file upload manipulation
   * This prevents accessing the filesystem of the hosted server
   */
  let results = [];

  if (req.files && req.files.length > 0) {
    console.log("🔥 [editCreator] Uploading new files to Appwrite:", {
      filesCount: req.files.length,
      fileNames: req.files.map(f => f.originalname),
      publicIDsToReplace: publicIDs
    });
    
    results = await updateManyFileToCloudinary(publicIDs, req.files, "post");
    
    console.log("🔥 [editCreator] Upload results:", {
      resultsCount: results.length,
      results: results.map(r => ({
        public_id: r.public_id,
        file_link: r.file_link,
        success: !!(r.public_id && r.file_link)
      }))
    });
  } else {
    console.log("🔥 [editCreator] No new files to upload");
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
    console.log("🔥 [editCreator] New files prepared for database:", creatorfiles.length);
  }

  // Handle existing images that should be preserved
  if (data.existingImages && Array.isArray(data.existingImages)) {
    console.log("🔥 [editCreator] Processing existing images:", {
      existingImagesCount: data.existingImages.length,
      existingImages: data.existingImages
    });
    
    const existingFiles = data.existingImages.map((imgUrl) => ({
      creatorfilelink: imgUrl,
      creatorfilepublicid: null, // Existing images might not have public_id
    }));
    
    console.log("🔥 [editCreator] Existing files prepared:", existingFiles.length);
    
    // Merge existing files with new files
    creatorfiles = [...existingFiles, ...creatorfiles];
    
    console.log("🔥 [editCreator] Final creatorfiles after merge:", {
      totalFiles: creatorfiles.length,
      existingFiles: existingFiles.length,
      newFiles: results.length
    });
  } else {
    console.log("🔥 [editCreator] No existing images to preserve");
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

    if (creatorfiles && creatorfiles.length > 0) {
      console.log("🔥 [editCreator] Updating creator files:", {
        oldFilesCount: currentuser.creatorfiles.length,
        newFilesCount: creatorfiles.length,
        files: creatorfiles.map(f => ({
          link: f.creatorfilelink,
          publicId: f.creatorfilepublicid
        }))
      });
      currentuser.creatorfiles = creatorfiles;
    } else {
      console.log("🔥 [editCreator] No files to update, keeping existing files");
    }

    console.log("🔥 [editCreator] Saving user with updated data:", {
      name: currentuser.name,
      age: currentuser.age,
      location: currentuser.location,
      price: currentuser.price,
      hosttype: currentuser.hosttype,
      filesCount: currentuser.creatorfiles.length
    });

    await currentuser.save();

    console.log("✅ [editCreator] Creator updated successfully");

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

module.exports = editCreator;
