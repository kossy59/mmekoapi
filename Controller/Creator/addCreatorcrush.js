const crushdb = require("../../Creators/crushdb");

const createCreator = async (req, res) => {
  const creatorid = req.body.creatorid;
  const userid = req.body.userid;

  if (!creatorid && !userid) {
    return res
      .status(400)
      .json({ ok: false, message: "user Id Or Creator Id invalid!!" });
  }

  //let data = await connectdatabase()

  try {
    //let userdb = await data.databar.listDocuments(data.dataid,data.creatorCol)

    //  let currentuser = userdb.documents.find(value=>{
    //   return value.$id === hostid
    //  })

    let currentuser = await crushdb.findOne({ creatorid: creatorid }).exec();

    if (currentuser) {
      return res
        .status(409)
        .json({ ok: false, message: `creator already exist as crush` });
    }

    let crush = {
      creatorid: creatorid,
      userid: userid,
    };

    await crushdb.create(crush);

    // await data.databar.updateDocument(data.dataid,data.creatorCol,currentuser._id,currentuser)

    return res
      .status(200)
      .json({ ok: true, message: `Creator Update successfully` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createCreator;
