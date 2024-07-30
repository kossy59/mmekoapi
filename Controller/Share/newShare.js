const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createShare = async (req,res)=>{

    const userid = req.body.userid;
    const content = req.body.content;
    const postid = req.body.postid;

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    let data = await connectdatabase()

    try{
      


        if(!content){
            content = ''
        }
           
           let share =     {
                    userid,
                    postid,
                    content,
                    sharetime:`${Date.now()}`,
                }
            

            let  du = await data.databar.createDocument(data.dataid,data.shareCol,sdk.ID.unique(),share)


            return res.status(200).json({"ok":true,"message":`post Shared successfully`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createShare