let documentdb = require("../../Creators/document");

const getdocument = async (req, res) => {
  try {
    // Find all documents and populate the idPhotofile and holdingIdPhotofile fields
    const docs = await documentdb
      .find({})
      .populate('idPhotofile', 'idPhotofilelink') // Populate the idPhotofilelink field
      .populate('holdingIdPhotofile', 'holdingIdPhotofilelink') // Populate the holdingIdPhotofilelink field
      .exec();

    if (!docs || docs.length === 0) {
      return res.status(404).json({ ok: false, message: "No documents found" });
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