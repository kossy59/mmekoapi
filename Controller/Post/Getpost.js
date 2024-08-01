const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readPost = async (req,res)=>{

    let data = await connectdatabase()
  
    try{
      
            let  postdb = await data.databar.listDocuments(data.dataid,data.postCol)
           
            let  userdb = await data.databar.listDocuments(data.dataid,data.colid)
           
            let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)
           

            let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
           
            let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)
            

           
            
            let post = [];

          
            for(let i = 0; i<postdb.documents.length; i++){

             

                for(let j = 0; j<userdb.documents.length; j++){

                    for(let k = 0; k<comdb.documents.length; k++){

                       
                       

                        if(postdb.documents[i].userid === userdb.documents[j].$id && comdb.documents[k].useraccountId === userdb.documents[j].$id ){

                           
                            let con = {
                                username: `${ userdb.documents[j].firstname} ${ userdb.documents[j].lastname}`,
                                nickname:  `${ userdb.documents[j].nickname}`,
                                userphoto: `${comdb.documents[k].photoLink}`,
                                content: `${postdb.documents[i].content}`,
                                postphoto: `${postdb.documents[i].postlink}`,
                                posttime: `${postdb.documents[i].posttime}`,
                                posttype: `${postdb.documents[i].posttype}`,
                                postid: `${postdb.documents[i].$id}`,
                                like:[],
                                comment:[]
                            }

                            post.push(con)

                        }

                    }

                }

            }
    
           
            for(let i = 0; i<post.length; i++){
                
                if(commentdb.documents.length <= 0){
                    
                    continue;
                    
                }else{

                    for(let j = 0; j < commentdb.documents.length; j++){
                    if(post[i].postid === commentdb.documents[j].postid){
                     post[i].comment.push(commentdb.documents[j])
                    }

                  }
                }
                
            }
            
            console.log(commentdb.documents.length)
            for(let i = 0; i<post.length; i++){

              if(likedb.documents.length <= 0){

               continue;
                
              }else{

                for(let j = 0; j < likedb.documents.length; j++){
                 if(post[i].postid === likedb.documents[j].postid){
                     post[i].like.push(likedb.documents[j])
                 }

                }
            }
            }

            console.log(postdb.documents.length)
            console.log(userdb.documents.length)
            console.log(comdb.documents.length)


            return res.status(200).json({"ok":true,"message":`Enter new password`,post:post})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readPost