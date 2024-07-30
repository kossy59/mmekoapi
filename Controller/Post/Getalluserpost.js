const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readPost = async (req,res)=>{

    const userid = req.body.userid;
   
    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.postCol)

            let du = dupplicate.documents.filter(value=>{
                return value.userid === userid
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this post!!'});
        
               }
            return res.status(200).json({"ok":true,"message":`All Post`,post:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readPost