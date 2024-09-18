// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
//we go also delete shared like and comment with this post id

const postdata = require("../../Models/post")
const commentdata = require("../../Models/comment")
const likedata = require("../../Models/like")

const deletePost = async (req,res)=>{

    const postid =  req.body.postid;

    if(!postid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

  
    //let data = await connectdatabase()

    try{
       
            // let  dupplicate = await data.databar.listDocuments(data.dataid,data.postCol)
           
            // let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
          
            // let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)

           
            //  let du = dupplicate.documents.filter(value=>{
            //     return value.$id === postid
            //    })

               let du = await postdata.findOne({_id:postid}).exec()
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not delete this post!!'});
        
               }
             
            //    let listofcomments = commentdb.documents.filter(value=>{
            //     return value.postid === postid
            //    })

               await commentdata.deleteMany({postid:postid}).exec()
               await likedata.deleteMany({postid:postid}).exec()

              




           
          const posthotolink = du.postlink;
          const postID = du._id
          await postdata.deleteMany({_id:postid}).exec()

            return res.status(200).json({"ok":true,"message":`Post deleted successfully`,post:{postphoto:posthotolink,postid:postID}})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = deletePost