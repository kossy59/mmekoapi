const userValidationSchema = require("../../config/validate");
const Application_model = require("../../Models/Application_model");
const appwriteHelper = require("../../utiils/appwrite");
const createUsermodel = async (req, res) => {
  try {
    const { fullName, address, country, city, residentialAddress } = req.body;
    const { error } = userValidationSchema.validate({
      fullName,
      address,
      country,
      city,
      residentialAddress,
    });
    if (error) {
      return res
        .status(400)
        .json({ ok: false, message: error.details[0].message });
    }
    const acceptedApp = await Application_model.findOne({
      userid: req.userId,
      Model_Application_status: "accepted",
    });

    if (acceptedApp) {
      return res.status(400).json({
        ok: false,
        message: "Your application has already been accepted. You are a model.",
      });
    }

    // Check if user has a pending application
    const pendingApp = await Application_model.findOne({
      userid: req.userId,
      Model_Application_status: "pending",
    });

    if (pendingApp) {
      return res.status(400).json({
        ok: false,
        message:
          "You already have a pending application. Please wait for approval.",
      });
    }

    if (!req.files || !req.files.idPhoto || !req.files.selfieWithId) {
      return res
        .status(400)
        .json({ ok: false, message: "Both ID photos are required" });
    }

    const idPhotoUpload = await appwriteHelper.uploadSingleFileToCloudinary(
      req.files.idPhoto[0],
      "profile"
    );
    const selfieUpload = await appwriteHelper.uploadSingleFileToCloudinary(
      req.files.selfieWithId[0],
      "model"
    );
    console.log(idPhotoUpload, selfieUpload);

    const idPhotoUrl = idPhotoUpload.file_link;
    const selfieWithIdUrl = selfieUpload.file_link;
    if (!idPhotoUrl || !selfieWithIdUrl) {
      return res
        .status(500)
        .json({ ok: false, message: "Failed to upload images" });
    }
    console.log(req.userId);
    const newUser = new Application_model({
      fullName,
      address,
      country,
      city,
      residentialAddress,
      idPhoto: idPhotoUrl,
      selfieWithId: selfieWithIdUrl,
      Model_Application: true,
      Model_Application_status: "pending",
      exclusive_verify: false,
      userid: req.userId,
    });
    console.log(newUser);
    await newUser.save();

    return res.status(201).json({
      ok: true,
      message: "Model application submitted successfully",
      application: newUser,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: "Server Error", error: error.message });
  }
};

module.exports = { createUsermodel };
