const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");
//we go also delete shared like and comment with this post id
const deletePost = async (req,res)=>{

    const postid =  req.body.postid;

    if(!postid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

  
    let data = await connectdatabase()

    try{
       
            let  dupplicate = await data.databar.listDocuments(data.dataid,data.postCol)
           
            let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
          
            let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)

           
             let du = dupplicate.documents.filter(value=>{
                return value.$id === postid
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not delete this post!!'});
        
               }
             
               let listofcomments = commentdb.documents.filter(value=>{
                return value.postid === postid
               })

               if(listofcomments.length > 0){
                for(let i = 0; i<listofcomments.length; i++){
                    console.log('deleting post comment '+ listofcomments[i])
                    data.databar.deleteDocument(data.dataid,data.commentCol,listofcomments[i].$id)

                }
               }

              
               let listoflike = likedb.documents.filter(value=>{
                return value.postid === postid
               })

               if(listoflike.length > 0){
                for(let i = 0; i<listoflike.length; i++){
                    console.log('deleting post comment '+ listoflike[i])
                    data.databar.deleteDocument(data.dataid,data.likeCol,listoflike[i].$id)

                }
               }





           
          const posthotolink = du[0].postlink;
          const postID = du[0].$id
          data.databar.deleteDocument(data.dataid,data.postCol,du[0].$id)

            return res.status(200).json({"ok":true,"message":`Post deleted successfully`,post:{postphoto:posthotolink,postid:postID}})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = deletePost