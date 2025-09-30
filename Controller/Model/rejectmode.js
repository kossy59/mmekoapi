let admindb = require("../../Models/admindb");
const models = require("../../Models/models");
const userdb = require("../../Models/userdb");

const createModel = async (req, res) => {

  const userid = req.body.userid;
  const docID = req.body.docid


  if (!userid && !docID) {
    return res.status(400).json({ "ok": false, 'message': 'user Id invalid!!' })
  }

  try {

    await models.deleteOne({ _id: req.body.id }).exec()

    let respond = {
      userid: userid,
      message: `you exclusive application has been rejected`,
      seen: true
    }
    const user = userdb.findOne({ "_id": userid })
    user.modelId = "";
    user.creator_listing = false
    await user.save()
    await admindb.create(respond)

    return res.status(200).json({ "ok": true, "message": `host Updated successfully`, hostid: docID })


  } catch (err) {
    return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
  }
}

module.exports = createModel