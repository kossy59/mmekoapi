const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");
//we go also delete shared like and comment with this post id
const deletePost = async (req,res)=>{
    const userid = req.body.userid;
    const shareid =  req.body.shareid;

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.shareCol)

            let du = dupplicate.documents.filter(value=>{
                return value.userid === userid  && value.$id === shareid
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not delete this post!!'});
        
               }
           

          data.databar.deleteDocument(data.dataid,data.shareCol,du[0].$id)

            return res.status(200).json({"ok":true,"message":`Post deleted successfully`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = deletePost