const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const updatesharedPost = async (req,res)=>{
    const userid = req.body.userid;
    const content = req.body.content;
    const shareid = req.body.shareid;

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
                return res.status(409).json({"ok":false,'message': 'current user can not edit this post!!'});
        
               }

            let Content = du[0].content


            if(!content){
                content = Content;
            }

            await data.databar.updateDocument(
                data.dataid,
                data.shareCol,
                 du[0].$id,
                {
                    content,
                    sharetime:`${Date.now()}`
                }
            )

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,post:du[0]})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatesharedPost