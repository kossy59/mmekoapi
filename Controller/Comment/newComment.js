const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createComment = async (req,res)=>{

    const userid = req.body.userid;
    const content = req.body.content;
    const sharedid = req.body.sharedid;
    const postid = req.body.postid;
   
    if(!userid && !content && !postid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    let data = await connectdatabase()

    try{
      

        if(!sharedid){
            sharedid = ""
        }
           
           let comment =     {
                    userid,
                    content,
                    sharedid,
                    postid,
                    posttime:`${Date.now()}`
                    
                }
            

            let  du = await data.databar.createDocument(data.dataid,data.commentCol,sdk.ID.unique(),comment)


            return res.status(200).json({"ok":true,"message":`Comment Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createComment