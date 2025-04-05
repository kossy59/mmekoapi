// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const commentdata = require("../../Models/comment")

const createComment = async (req,res)=>{

    const userid = req.body.userid;
    const content = req.body.content;
    let sharedid = req.body.sharedid;
    const postid = req.body.postid;
   
    if(!userid && !content && !postid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

   // let data = await connectdatabase()

    try{
      
      // console.log("this post id "+ postid)
        if(!sharedid){
            sharedid = ""
        }
           
           let comment =     {
                    userid:userid,
                    content,
                    sharedid:sharedid,
                    postid:postid,
                    commenttime:`${Date.now()}`
                    
                }
            
               console.log('we are on database update')
            //await data.databar.createDocument(data.dataid,data.commentCol,sdk.ID.unique(),comment)
            await commentdata.create(comment)


            return res.status(200).json({"ok":true,"message":`Comment Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createComment