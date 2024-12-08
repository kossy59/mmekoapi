// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const postdbs = require("../../Models/post")
const userdbs = require("../../Models/userdb")
const comdbs = require("../../Models/usercomplete")
const commentdbs = require("../../Models/comment")
const likedbs = require("../../Models/like")
const alldelete = require("../../utiils/Deletes/deleteAcceptsBook")

const readPost = async (req,res)=>{

   // let data = await connectdatabase()
  
    try{
      
            //let  postdb = await data.databar.listDocuments(data.dataid,data.postCol)
           
            //let  userdb = await data.databar.listDocuments(data.dataid,data.colid)
           
            //let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)
           

            //let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
           
           // let  likedb = await data.databar.listDocuments(data.dataid,data.likeCol)

            let postdb = await postdbs.find().exec()
            let userdb = await userdbs.find().exec()
            let comdb = await comdbs.find().exec()
            let commentdb = await commentdbs.find().exec()
            let likedb = await likedbs.find().exec()

             alldelete()
            
          //console.log("number of post "+postdb.length)
           
            
            let post = [];

          
            for(let i = 0; i < postdb.length; i++){

             
                       // console.log("list of post userid id "+ postdb[i].userid)
                for(let j = 0; j<userdb.length; j++){
                    //console.log("list of userdb id "+ userdb[j]._id)

                    for(let k = 0; k<comdb.length; k++){

                       
                       //console.log("list of comdb id "+ comdb[k].useraccountId)

                        if(String(postdb[i].userid) === String(userdb[j]._id) && String(comdb[k].useraccountId) === String(userdb[j]._id )){
 
                            //console.log("inside getting post")

                            let userpoto = ""

                            if(comdb[k].photoLink){
                                userpoto = comdb[k].photoLink
                            }
                           

                           
                            let con = {
                                username: `${ userdb[j].firstname} ${ userdb[j].lastname}`,
                                nickname:  `${ userdb[j].nickname}`,
                                userphoto: `${userpoto}`,
                                content: `${postdb[i].content}`,
                                postphoto: `${postdb[i].postlink}`,
                                posttime: `${postdb[i].posttime}`,
                                posttype: `${postdb[i].posttype}`,
                                postid: `${postdb[i]._id}`,
                                active:userdb[j].active,
                                like:[],
                                comment:[],
                                userid:userdb[j]._id
                            }
                           // console.log("post time "+con.posttime)

                            post.push(con)

                        }

                    }

                }

            }

            //console.log("list of un verifyied post "+post.length)
    
           
            for(let i = 0; i<post.length; i++){
                
                if(commentdb.length <= 0){
                    
                    continue;
                    
                }else{

                    for(let j = 0; j < commentdb.length; j++){
                    if(post[i].postid === commentdb[j].postid){
                     post[i].comment.push(commentdb[j])
                    }

                  }
                }
                
            }
            
            console.log(commentdb.length)
            for(let i = 0; i<post.length; i++){

              if(likedb.length <= 0){

               continue;
                
              }else{

                for(let j = 0; j < likedb.length; j++){
                 if(post[i].postid === likedb[j].postid){
                     post[i].like.push(likedb[j])
                 }

                }
            }
            }

          


            //console.log("list of post"+post.length)

            return res.status(200).json({"ok":true,"message":`Enter new password`,post:post})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readPost