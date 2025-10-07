let userdb = require("../../Creators/userdb");
let documentdb = require("../../Creators/document");
let admindb = require("../../Creators/admindb");
const creators = require("../../Creators/creators");

const createCreator = async (req, res) => {
  const { userid, docid } = req.body;

  if (!userid || !docid) {
    return res.status(400).json({ ok: false, message: "User Id or document Id invalid!" });
  }

  try {
    // ✅ 1. Update user verification
    const user = await userdb.findById(userid).exec();
    if (!user) return res.status(404).json({ ok: false, message: "User not found!" });

    user.exclusive_verify = true;
    await user.save();

    // ✅ 2. Update creator verification status
    const creator = await creators.findOne({ userid }).exec();
    if (creator) {
      creator.verify = "live";
      await creator.save();
    }

    // ✅ 3. Update document verification (instead of deleting it)
    const document = await documentdb.findById(docid).exec();
    if (document) {
      document.verify = true; // update verify field to true
      await document.save();
    }

    // ✅ 4. Send admin notification
    await admindb.create({
      userid,
      message: `Congratulations! Your creator application has been approved.`,
      seen: true,
    });

    return res.status(200).json({
      ok: true,
      message: "Creator verified successfully",
      hostid: docid,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createCreator;
