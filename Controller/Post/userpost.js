const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const createPost = async (req,res)=>{

    const userid = req.body.userid;
    let postlink = req.body.postlink;
    let content = req.body.content;
    let posttype = req.body.posttype;
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    let data = await connectdatabase()

    try{
      

        if(!postlink){
            postlink = ""
        }

        if(!content){
            content = ''
        }
           
           let posts =  {
                    userid,
                    postlink,
                    posttime:`${Date.now()}`,
                    content,
                    posttype
                }
            

              await data.databar.createDocument(data.dataid,data.postCol,sdk.ID.unique(),posts)

            
            let  postdb = await data.databar.listDocuments(data.dataid,data.postCol)
            let  userdb = await data.databar.listDocuments(data.dataid,data.colid)
            let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)

            let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)
            let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)

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
                for(let j = 0; j < commentdb.documents.length; j++){
                 if(post[i].postid === commentdb.documents[j].postid){
                     post[i].comment.push(commentdb.documents[j])
                 }

                }
            }

            for(let i = 0; i<post.length; i++){
                for(let j = 0; j < likedb.documents.length; j++){
                 if(post[i].postid === likedb.documents[j].postid){
                     post[i].like.push(likedb.documents[j])
                 }

                }
            }

            return res.status(200).json({"ok":true,"message":`Posted successfully`,post:post})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createPost