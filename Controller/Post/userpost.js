// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const postdata = require("../../Models/post")
const commentdata  = require("../../Models/comment")
const likedata  = require("../../Models/like")
const userdata  = require("../../Models/userdb")
const comdata  = require("../../Models/usercomplete")

const createPost = async (req,res)=>{

    const userid = req.body.userid;
    let postlink = req.body.postlink;
    let content = req.body.content;
    let posttype = req.body.posttype;
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    console.log("posting image")

   // let data = await connectdatabase()

    try{
      

        if(!postlink){
            console.log("no photolink")
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
            

           // let currentpostid = await data.databar.createDocument(data.dataid,data.postCol,sdk.ID.unique(),posts)
           await  postdata.create(posts)

            let currentpostid = await postdata.findOne({posttime:posts.posttime})
            let  postdb = await postdata.find().exec()
            let  userdb = await userdata.find().exec()
            let  comdb = await comdata.find().exec()

            let  likedb = await likedata.find().exec()
            let  commentdb = await commentdata.find().exec()

            let post ={};
            console.log("current posts id "+currentpostid._id)

          
             

                for(let j = 0; j<userdb.length; j++){

                    for(let k = 0; k<comdb.length; k++){

                       
                       

                        if( String(currentpostid.userid) === String(userdb[j]._id) && String(comdb[k].useraccountId) === String( userdb[j]._id) ){

                           console.log("found post")
                             post = {
                                username: `${ userdb[j].firstname} ${ userdb[j].lastname}`,
                                nickname:  `${ userdb[j].nickname}`,
                                userphoto: `${comdb[k].photoLink}`,
                                content: `${currentpostid.content}`,
                                postphoto: `${currentpostid.postlink}`,
                                posttime: `${currentpostid.posttime}`,
                                posttype: `${currentpostid.posttype}`,
                                postid: `${currentpostid._id}`,
                                like:[],
                                comment:[],
                                userid:userdb[j]._id
                            }

                            console.log("post time why "+currentpostid.posttime)
                             console.log("post id why "+currentpostid._id)
                              console.log("post type why "+currentpostid.posttype)

                           

                        }

                    }

                }

            

            
                for(let j = 0; j < commentdb.length; j++){
                 if(currentpostid._id === commentdb[j].postid){
                     post.comment.push(commentdb[j])
                 }

                }
            

          
                for(let j = 0; j < likedb.length; j++){
                 if(currentpostid._id === likedb[j].postid){
                     post.like.push(likedb[j])
                 }

                }
            console.log("posts "+post.posttime)

            return res.status(200).json({"ok":true,"message":`Posted successfully`,post:post})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createPost