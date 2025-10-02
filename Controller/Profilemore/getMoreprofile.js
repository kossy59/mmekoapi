// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const completedb = require("../../Creators/usercomplete")

const readProfile = async (req, res) => {

    const userid = req.body.userid;
   
    //let data = await connectdatabase()

    try {

        // let  dupplicate = await data.databar.listDocuments(data.dataid,data.userincol)

        // let du = dupplicate.documents.filter(value=>{
        //     return value.useraccountId === userid
        //    })

        let du = await completedb.findOne({ useraccountId: userid })

        // console.log("user photolink "+userid)
        
        if (!du) {
            return res.status(409).json({ "ok": false, 'message': 'Current user can not edit this post!!' });
        
        }
        return res.status(200).json({ "ok": true, "message": `All Post`, profile: du })
      
          
    } catch (err) {
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }
}

module.exports = readProfile