const documentdb = require("../../Creators/document");
const userdb = require("../../Creators/userdb");

const checkDocumentStatus = async (req, res) => {
  const userid = req.params.userid;

  try {
    const user = await userdb.findById(userid).exec();
    console.log("🔍 user found:", user?.fan_application_status, user?.fan_verified); // ADD THIS

    if (user?.fan_application_status === "accepted") {
      console.log("✅ returning approved");  // ADD THIS
      return res.status(200).json({ status: "approved" });
    }
    if (user?.fan_application_status === "rejected") {
      return res.status(200).json({ status: "rejected" });
    }

    // ✅ If no status yet, check if a document exists (= pending)
    const doc = await documentdb.findOne({ userid }).exec();
    if (doc) {
      return res.status(200).json({ status: "pending" });
    }

    return res.status(200).json({ status: "none" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = checkDocumentStatus;