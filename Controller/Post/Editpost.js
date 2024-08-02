const { Duplex } = require('nodemailer/lib/xoauth2');
const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const updatePost = async (req,res)=>{
   
    const postid = req.body.postid;

    if(!postid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    let data = await connectdatabase()
    let post ={}

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.postCol)

            let du = dupplicate.documents.find(value=>{
                return value.$id === postid
               })
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this post!!'});
        
               }

               let  userdb = await data.databar.listDocuments(data.dataid,data.colid)
           
               let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)
              
   
               let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
              
               let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)


             

                for(let j = 0; j<userdb.documents.length; j++){

                    for(let k = 0; k<comdb.documents.length; k++){

                       
                       

                        if(du.userid === userdb.documents[j].$id && comdb.documents[k].useraccountId === userdb.documents[j].$id ){

                           
                             post = {
                                username: `${ userdb.documents[j].firstname} ${ userdb.documents[j].lastname}`,
                                nickname:  `${ userdb.documents[j].nickname}`,
                                userphoto: `${comdb.documents[k].photoLink}`,
                                content: `${du.content}`,
                                postphoto: `${du.postlink}`,
                                posttime: `${du.posttime}`,
                                posttype: `${du.posttype}`,
                                postid: `${du.$id}`,
                                like:[],
                                comment:[],
                                userid:userdb.documents[j].$id
                            }

                           

                        }

                    }

                }

            

            
                for(let j = 0; j < commentdb.documents.length; j++){
                 if(du.$id === commentdb.documents[j].postid){
                     post.comment.push(commentdb.documents[j])
                 }

                }
            

          
                for(let j = 0; j < likedb.documents.length; j++){
                 if(du.$id === likedb.documents[j].postid){
                     post.like.push(likedb.documents[j])
                 }

                }


            

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,post:post})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost