const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readuserShared = async (req,res)=>{

    const userid = req.body.userid;
   
    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.shareCol)

            let du = dupplicate.documents.filter(value=>{
                return value.userid === userid
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'No shared post!!'});
        
               }
            return res.status(200).json({"ok":true,"message":`All Post`,share:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readuserShared