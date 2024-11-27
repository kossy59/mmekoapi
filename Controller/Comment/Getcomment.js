// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const commentdata = require("../../Models/comment")
const userdata = require("../../Models/userdb")
const comdata = require("../../Models/usercomplete")

const readComment = async (req,res)=>{

    const postid = req.body.postid
   // let data = await connectdatabase()

    try{

       // let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
        let  userdb = await userdata.find().exec()
        let  comdb = await comdata.find().exec()

        // let test = commentdb.documents.filter(value=>{
        //    return value.postid === postid
        // })

        let test = await commentdata.find({postid:postid}).exec()
         if(!test[0]){
             return res.status(409).json({"ok":false,'message': `wrog comment id!`});
        }

        const comment = []

    
          
           for(let i =0; i<test.length; i++){
            for(let j = 0; j < userdb.length; j++){
                for(let k =0; k<comdb.length; k++){
                    if(String(test[i].userid) === String(userdb[j]._id) && String(test[i].userid) === String(comdb[k].useraccountId)
                        ){

                           
                           let com = {
                                commentuserphoto:comdb[k].photoLink,
                                commentusername:`${userdb[j].firstname} ${userdb[j].lastname}`,
                                content:test[i].content,
                                commentid:test[i]._id,
                                commenttime:test[i].commenttime,
                                commentuserid:userdb[j]._id,
                                commentnickname:userdb[j].nickname
                            }

                            comment.push(com)

                        }
                }
            }
           }

        
          
            return res.status(200).json({"ok":true,"message":`all comment`,comment:comment})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = readComment