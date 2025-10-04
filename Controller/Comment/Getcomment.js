// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const commentdata = require("../../Creators/comment")
const userdata = require("../../Creators/userdb")
const comdata = require("../../Creators/usercomplete")
const { filterBlockedComments } = require("../../utiils/blockFilter")

const readComment = async (req,res)=>{

    const postid = req.body.postid
    const userid = req.body.userid
   // let data = await connectdatabase()

    try{

       // let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
        let  userdb = await userdata.find().exec()
        let  comdb = await comdata.find().exec()

        // let test = commentdb.documents.filter(value=>{
        //    return value.postid === postid
        // })

        let test = await commentdata.find({postid:postid}).sort({commenttime: -1}).exec()
         if(!test[0]){
             return res.status(200).json({"ok":true,"message":`no comments found`,comment:[]});
        }

        // Filter out comments from blocked users
        const filteredComments = await filterBlockedComments(test, userid);

        const comment = []
        
        // Create maps for faster lookup
        const userMap = new Map();
        const comMap = new Map();
        
        userdb.forEach(user => {
            userMap.set(String(user._id), user);
        });
        
        comdb.forEach(com => {
            comMap.set(String(com.useraccountId), com);
        });
        
        // Process comments with optimized lookup
        for(let i = 0; i < filteredComments.length; i++){
            const user = userMap.get(String(filteredComments[i].userid));
            const com = comMap.get(String(filteredComments[i].userid));
            
            if(user && com){
                let commentObj = {
                    commentuserphoto: com.photoLink,
                    commentusername: `${user.firstname} ${user.lastname}`,
                    content: filteredComments[i].content,
                    commentid: filteredComments[i]._id,
                    commenttime: filteredComments[i].commenttime,
                    commentuserid: user._id,
                    commentnickname: user.nickname
                };
                comment.push(commentObj);
            }
        }

        
          
            return res.status(200).json({"ok":true,"message":`all comment`,comment:comment})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readComment