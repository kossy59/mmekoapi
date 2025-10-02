let documentdb = require("../../Models/document");

const getdocument = async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res.status(400).json({ ok: false, message: "User ID is required" });
  }

  try {
    // Find all documents submitted by this user
    const docs = await documentdb.find({ userid }).exec();

    if (!docs || docs.length === 0) {
      return res.status(404).json({ ok: false, message: "No documents found for this user" });
    }

    return res.status(200).json({
      ok: true,
      count: docs.length,
      documents: docs,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getdocument;
