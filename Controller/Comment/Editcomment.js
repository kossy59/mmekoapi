const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const updateComment = async (req,res)=>{

    const commentid = req.body.commentid;
    const content = req.body.content;

    if(!commentid && !content){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.commentCol)

            let du = dupplicate.documents.filter(value=>{
                return value.$id === commentid
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this comment!!'});
        
               }
            

            await data.databar.updateDocument(
                data.dataid,
                data.commentCol,
                 du[0].$id,
                {
                    content,
                    commenttime:`${Date.now()}`,
                    
                }
            )

            return res.status(200).json({"ok":true,"message":`Updated Successfully`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updateComment