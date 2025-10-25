// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const creators = require("../../Creators/creators");
const userdb = require("../../Creators/userdb");
const { deleteFile } = require("../../utiils/storj");
const { processPortfolioDeletionRefund } = require("../../scripts/refundPendingBalances");

const createCreator = async (req, res) => {
  const hostid = req.body.hostid;

  if (!hostid) {
    return res.status(400).json({
      ok: false,
      message: "user Id invalid!!",
    });
  }

  //  let data = await connectdatabase()

  try {
    //let userdb = await data.databar.listDocuments(data.dataid,data.creatorCol)

    //    let currentuser = userdb.documents.find(value=>{
    //     return value.$id === hostid
    //    })

    let currentuser =  await creators
      .findOne({
        _id: hostid,
      })
      .exec();;

    if (!currentuser) {
      return res.status(409).json({
        ok: false,
        message: `user can not edit portfolio`,
      });
    }
    const user = (await userdb.findOne({ _id: currentuser.userid }).exec() || await userdb.findOne({ creator_portfolio_id: hostid }).exec());
    user.creator_portfolio = false
    user.creator_portfolio_id = "";
    user.creator_portfolio_id = "";
    await user.save()

    //await data.databar.deleteDocument(data.dataid,data.creatorCol,currentuser.$id)

    // Process refunds for pending requests BEFORE portfolio deletion
    console.log(`🔄 Starting refund process for portfolio ${hostid}`);
    try {
      const refundResult = await processPortfolioDeletionRefund(hostid);
      if (refundResult.success) {
        console.log(`✅ Processed ${refundResult.processed} refunds totaling ${refundResult.totalAmount} for deleted portfolio ${hostid}`);
      } else {
        console.log(`⚠️ Refund process completed but no refunds were processed for portfolio ${hostid}`);
      }
    } catch (refundError) {
      console.error("❌ Error processing refunds for deleted portfolio:", refundError);
      // Don't fail the deletion if refund processing fails
    }

    await creators
      .deleteOne({
        _id: hostid,
      })
      .exec();

    // Delete creator images from cloudinary
    if (currentuser.creatorfiles) {
      currentuser.creatorfiles.forEach(async (creatorfile) => {
        const id = creatorfile.creatorfilepublicid;
        if (creatorfile.creatorfilepublicid) {
          await deleteFile(id, "post");
        }
      });
    }

    return res.status(200).json({
      ok: true,
      message: `Creator Deleted successfully`,
    });
  } catch (err) {
    console.log("-----------------",err,"---------------")
    return res.status(500).json({
      ok: false,
      message: `${err.message}!`,
    });
  }
};

module.exports = createCreator;
