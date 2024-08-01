const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const deleteComment = async (req,res)=>{
    const commentid = req.body.commentid;


    if(!commentid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.commentCol)

            let du = dupplicate.documents.filter(value=>{
                return value.$id === commentid
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not delete this post!!'});
        
               }
           

          data.databar.deleteDocument(data.dataid,data.commentCol,du[0].$id)

            return res.status(200).json({"ok":true,"message":`Comment deleted successfully`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = deleteComment