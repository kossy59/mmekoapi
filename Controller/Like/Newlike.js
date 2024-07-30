const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createLike = async (req,res)=>{

    const userid = req.body.userid;
    const sharedid = req.body.sharedid;
    const postid = req.body.postid;
   
    if(!userid  && !postid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    let data = await connectdatabase()

    try{

        let  dupplicate = await data.databar.listDocuments(data.dataid,data.likeCol)

        let du = dupplicate.documents.find(value=>{

            return value.userid === userid  && value.$id === postid
           })
    
           if(du){
            data.databar.deleteDocument(data.dataid,data.likeCol,du[0].$id)
            return res.status(409).json({"ok":false,'message': 'ulike post success!!'});
    
           }
      

        if(!sharedid){
            sharedid = ""
        }

       
           
           let like =     {
                    userid,
                    sharedid,
                    postid,
                    
                }
            

            data.databar.createDocument(data.dataid,data.likeCol,sdk.ID.unique(),like)


            return res.status(200).json({"ok":true,"message":`like post Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createLike