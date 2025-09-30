let userdb = require("../../Creators/userdb");
let documentdb = require("../../Creators/document");
let admindb = require("../../Creators/admindb");
const creators = require("../../Creators/creators");

const createCreator = async (req, res) => {
  const userid = req.body.userid;
  const docID = req.body.docid;

  if (!userid && !docID) {
    return res.status(400).json({ ok: false, message: "user Id invalid!!" });
  }

  try {
    let user = await userdb.findOne({ _id: userid }).exec();

    user.exclusive_verify = true;
    await user.save();
    const theCreator= await creators.findOne({userid:userid}).exec();
    if(theCreator){
      theCreator.verify="live"
      await theCreator.save()
    }

    await documentdb.deleteOne({ _id: docID }).exec();

    let respond = {
      userid: userid,
      message: `Congratulation! Your creator application has been approve`,
      seen: true,
    };

    await admindb.create(respond);

    return res
      .status(200)
      .json({ ok: true, message: `host Updated successfully`, hostid: docID });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createCreator;
