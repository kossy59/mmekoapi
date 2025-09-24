const Application_model = require("../../Models/Application_model");
const userdb = require("../../Models/userdb");
const acceptModel = async (req, res) => {
  try {
    const { userId } = req.params;
    const application = await Application_model.findOne({ userid: userId });

    if (!application) {
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });
    }

    if (application.Model_Application_status === "accepted") {
      return res.status(400).json({ ok: false, message: "Already accepted" });
    }

    application.Model_Application_status = "accepted";
    application.Model_Application = true;
    application.exclusive_verify = true;
    await application.save();
    const user = await userdb.findById(application.userid);
    if (user) {
      user.Model_Application_status = "accepted";
      user.exclusive_verify = true;
      await user.save();
    }
    console.log(user);
    res.status(200).json({
      ok: true,
      message: "Model application accepted",
      application,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Reject
const rejectModel = async (req, res) => {
  try {
    const { userId } = req.params;
    const application = await Application_model.findOne({ userid: userId });

    if (!application) {
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });
    }

    if (application.Model_Application_status === "rejected") {
      return res
        .status(400)
        .json({ ok: false, message: "Cannot accept rejected application" });
    }

    application.Model_Application_status = "rejected";
    application.Model_Application = false;
    application.exclusive_verify = false;
    await application.save();
    const user = await userdb.findById(application.userid);
    if (user) {
      user.Model_Application_status = "rejected";
      user.exclusive_verify = false;
      await user.save();
    }
    // console.log(user);
    res.status(200).json({
      ok: true,
      message: "Model application rejected",
      application,
      user,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};
//get all model request
const getAllModelRequests = async (req, res) => {
  try {
    const users = await Application_model.find({ Model_Application: true });

    res.status(200).json({ ok: true, users });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = { acceptModel, rejectModel, getAllModelRequests };
