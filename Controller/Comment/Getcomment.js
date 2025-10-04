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
                const isVip = user.isVip || false;
                const vipEndDate = user.vipEndDate;
                const isVipActive = isVip && vipEndDate && new Date(vipEndDate) > new Date();
                
                // Try to get photo from user data first, then from com data
                const userPhoto = user.photolink || user.photoLink || user.profileImage || user.avatar || user.image;
                const comPhoto = com.photoLink || com.photolink || com.profileImage || com.avatar || com.image;
                const finalPhoto = userPhoto || comPhoto;
                
                let commentObj = {
                    commentuserphoto: finalPhoto,
                    commentusername: `${user.firstname} ${user.lastname}`,
                    content: filteredComments[i].content,
                    commentid: filteredComments[i]._id,
                    commenttime: filteredComments[i].commenttime,
                    commentuserid: user._id,
                    commentnickname: user.nickname,
                    isVip: isVip,
                    vipStartDate: user.vipStartDate,
                    vipEndDate: user.vipEndDate
                };
                comment.push(commentObj);
            } else {
                // Fallback: create comment with basic info even if we don't have complete user data
                if (user) {
                    const commentObj = {
                        commentuserphoto: user.photolink || user.photoLink || user.profileImage || user.avatar || user.image,
                        commentusername: `${user.firstname || 'Unknown'} ${user.lastname || 'User'}`,
                        content: filteredComments[i].content,
                        commentid: filteredComments[i]._id,
                        commenttime: filteredComments[i].commenttime,
                        commentuserid: user._id,
                        commentnickname: user.nickname,
                        isVip: user.isVip || false,
                        vipStartDate: user.vipStartDate,
                        vipEndDate: user.vipEndDate
                    };
                    comment.push(commentObj);
                }
            }
        }

        
          
            return res.status(200).json({"ok":true,"message":`all comment`,comment:comment})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readComment