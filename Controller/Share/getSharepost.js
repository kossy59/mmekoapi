const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readShare = async (req,res)=>{

    let data = await connectdatabase()

    try{

            let  du = await data.databar.listDocuments(data.dataid,data.shareCol)


            return res.status(200).json({"ok":true,"message":`Enter new password`,share:du.documents})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readShare