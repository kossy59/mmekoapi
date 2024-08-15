const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readProfile = async (req,res)=>{

    const userid = req.body.userid;
   
    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)
            let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)
            let  commentDB = await data.databar.listDocuments(data.dataid,data.commentCol)
            let  likeDB = await data.databar.listDocuments(data.dataid,data.likeCol)
            let  postDB = await data.databar.listDocuments(data.dataid,data.postCol)

            let du = dupplicate.documents.find(value=>{
                return value.$id === userid
               })
               let com = comdb.documents.find(value=>{
                return value.useraccountId === userid
               })

               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can view this post!!'});
        
               }

               let user = {
                userid:du.$id,
                username:`${du.firstname} ${du.lastname}`,
                admin:du.admin,
                userphoto:com.photoLink,
                nickname:`${du.nickname}`,
                aboutuser:`${com.details}`,
                location: `${du.state}, ${du.country}`,
                active:du.active,
                gender:du.gender,
                post:[],
                firstname:du.firstname,
                lastname:du.lastname  
               }

               for(let i = 0; i < postDB.documents.length; i++){

                if(postDB.documents[i].userid === du.$id){
                    con = {
                        content:postDB.documents[i].content,
                        postphoto: `${postDB.documents[i].postlink}`,
                        posttime: `${postDB.documents[i].posttime}`,
                        posttype: `${postDB.documents[i].posttype}`,
                        postid: `${postDB.documents[i].$id}`,
                        userid:du.$id,
                        active:du.active,
                        comment:[],
                        like:[]
                    }
                    user.post.push(con)
                }

               }


               for(let i = 0; i<user.post.length; i++){
                
                if(commentDB.documents.length <= 0){
                    
                    continue;
                    
                }else{

                    for(let j = 0; j < commentDB.documents.length; j++){
                    if(user.post[i].postid === commentDB.documents[j].postid){
                    user.post[i].comment.push(commentDB.documents[j])
                    }

                  }
                }
                
            }

            for(let i = 0; i<user.post.length; i++){

                if(likeDB.documents.length <= 0){
  
                 continue;
                  
                }else{
  
                  for(let j = 0; j < likeDB.documents.length; j++){
                   if(user.post[i].postid === likeDB.documents[j].postid){
                       user.post[i].like.push(likeDB.documents[j])
                   }
  
                  }
              }
              }


            return res.status(200).json({"ok":true,"message":`All Post`,profile:user})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readProfile