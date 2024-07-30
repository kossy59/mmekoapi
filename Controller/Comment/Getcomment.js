const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readComment = async (req,res)=>{

    let data = await connectdatabase()

    try{

            let  du = await data.databar.listDocuments(data.dataid,data.commentCol)


            return res.status(200).json({"ok":true,"message":`all comment`,comment:du.documents})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readComment