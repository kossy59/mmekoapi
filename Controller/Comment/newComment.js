// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const commentdata = require("../../Creators/comment");
const postdbs = require("../../Creators/post");
const admindb = require("../../Creators/admindb");
const userdb = require("../../Creators/userdb");
let sendEmail = require("../../utiils/sendEmailnot");
const { pushmessage } = require("../../utiils/sendPushnot");

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

            // Send notifications for new comment
            const postuser = await postdbs.findOne({ _id: postid }).exec();
            if (postuser && postuser.userid !== userid) { // Don't notify if user is commenting on their own post
              await sendEmail(postuser.userid, "user commented on your Post");
              await pushmessage(postuser.userid, "user commented on your Post", "creatoricon");
              
              // Create database notification for comment
              const commenter = await userdb.findOne({ _id: userid }).exec();
              if (commenter) {
                await admindb.create({
                  userid: postuser.userid,
                  message: `${commenter.firstname} ${commenter.lastname} commented on your post`,
                  seen: false
                });
              }
            }

            return res.status(200).json({"ok":true,"message":`Comment Success`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createComment