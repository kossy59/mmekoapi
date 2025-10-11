const documentdb = require("../../Creators/document");
const userdb = require("../../Creators/userdb");

const checkDocumentStatus = async (req, res) => {
  const userid = req.params.userid;  // Changed to req.params

  if (!userid) {
    return res.status(400).json({ ok: false, message: "User ID is required" });
  }

  try {
    const doc = await documentdb.findOne({ userid }).exec();
    if (doc) {
      return res.status(200).json({ status: "pending" });
    }

    const user = await userdb.findById(userid).exec();
    if (user && user.isCreator === false && !user.creator_portfoliio_Id) {
      return res.status(200).json({ status: "rejected" });
    }

    return res.status(200).json({ status: "none" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = checkDocumentStatus;