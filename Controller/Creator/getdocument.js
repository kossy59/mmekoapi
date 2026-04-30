let documentdb = require("../../Creators/document");
let userdb = require("../../Creators/userdb");

const getdocument = async (req, res) => {
  try {
    const docs = await documentdb.find({}).exec();

    if (!docs || docs.length === 0) {
      return res.status(404).json({ ok: false, message: "No documents found" });
    }

    const enriched = await Promise.all(
      docs.map(async (doc) => {
        try {
          const user = await userdb.findById(doc.userid).exec();
          return {
            ...doc.toObject(),
            firstname: doc.firstname || user?.firstname || "",
            lastname:  doc.lastname  || user?.lastname  || "",
            username:  user?.username  || "",
            photolink: user?.photolink || "",
          };
        } catch {
          return doc.toObject();
        }
      })
    );

    return res.status(200).json({
      ok: true,
      count: enriched.length,
      documents: enriched,
    });

  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = getdocument;