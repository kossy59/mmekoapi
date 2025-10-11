const Application_creator = require("../../Creators/Application_creator");
const userdb = require("../../Creators/userdb");
const acceptCreator = async (req, res) => {
  try {
    const { userId } = req.params;
    const application = await Application_creator.findOne({ userid: userId });

    if (!application) {
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });
    }

    if (application.Creator_Application_status === "accepted") {
      return res.status(400).json({ ok: false, message: "Already accepted" });
    }

    application.Creator_Application_status = "accepted";
    application.Creator_Application = true;
    application.creator_verified = true;
    await application.save();
    const user = await userdb.findById(application.userid);
    if (user) {
      user.Creator_Application_status = "accepted";
      user.creator_verified = true;
      await user.save();
    }
    console.log(user);
    res.status(200).json({
      ok: true,
      message: "Creator application accepted",
      application,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// Reject
const rejectCreator = async (req, res) => {
  try {
    const { userId } = req.params;
    const application = await Application_creator.findOne({ userid: userId });

    if (!application) {
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });
    }

    if (application.Creator_Application_status === "rejected") {
      return res
        .status(400)
        .json({ ok: false, message: "Cannot accept rejected application" });
    }

    application.Creator_Application_status = "rejected";
    application.Creator_Application = false;
    application.creator_verified = false;
    await application.save();
    const user = await userdb.findById(application.userid);
    if (user) {
      user.Creator_Application_status = "rejected";
      user.creator_verified = false;
      await user.save();
    }
    // console.log(user);
    res.status(200).json({
      ok: true,
      message: "Creator application rejected",
      application,
      user,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};
//get all creator request
const getAllCreatorRequests = async (req, res) => {
  try {
    const users = await Application_creator.find({ Creator_Application: true });

    res.status(200).json({ ok: true, users });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = { acceptCreator, rejectCreator, getAllCreatorRequests };
