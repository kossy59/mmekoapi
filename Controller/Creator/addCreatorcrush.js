const crushdb = require("../../Creators/crushdb");

const createCreator = async (req, res) => {
  const creator_portfolio_id = req.body.creator_portfolio_id;
  const userid = req.body.userid;

  console.log('🔍 [addcrush] Backend received:', { creator_portfolio_id, userid });

  if (!creator_portfolio_id && !userid) {
    console.log('❌ [addcrush] Missing required fields');
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

    // Check if this specific user already has this creator in their crush list
    let currentuser = await crushdb.findOne({ 
      creator_portfolio_id: creator_portfolio_id,
      userid: userid 
    }).exec();
    console.log('🔍 [addcrush] Checking existing crush for current user:', currentuser);

    if (currentuser) {
      console.log('❌ [addcrush] Creator already exists in current user crush list');
      return res
        .status(409)
        .json({ ok: false, message: `creator already exist as crush` });
    }

    let crush = {
      creator_portfolio_id: creator_portfolio_id,
      userid: userid,
    };

    console.log('🔍 [addcrush] Creating new crush:', crush);
    await crushdb.create(crush);
    console.log('✅ [addcrush] Crush created successfully');

    // await data.databar.updateDocument(data.dataid,data.creatorCol,currentuser._id,currentuser)

    return res
      .status(200)
      .json({ ok: true, message: `Creator Update successfully` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `${err.message}!` });
  }
};

module.exports = createCreator;
