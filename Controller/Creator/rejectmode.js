let admindb = require("../../Creators/admindb");
const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");

const createCreator = async (req, res) => {

  const userid = req.body.userid;
  const docID = req.body.docid


  if (!userid && !docID) {
    return res.status(400).json({ "ok": false, 'message': 'user Id invalid!!' })
  }

  try {

    await creators.deleteOne({ _id: req.body.id }).exec()

    let respond = {
      userid: userid,
      message: `you exclusive application has been rejected`,
      seen: false
    }
    const user = userdb.findOne({ "_id": userid })
    user.creator_portfolio_id = "";
    user.creator_portfolio = false
    await user.save()
    await admindb.create(respond)

    return res.status(200).json({ "ok": true, "message": `host Updated successfully`, hostid: docID })


  } catch (err) {
    return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
  }
}

module.exports = createCreator