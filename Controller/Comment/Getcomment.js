const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const readComment = async (req,res)=>{

    const postid = req.body.postid
    let data = await connectdatabase()

    try{

        let  commentdb = await data.databar.listDocuments(data.dataid,data.commentCol)
        let  userdb = await data.databar.listDocuments(data.dataid,data.colid)
        let  comdb = await data.databar.listDocuments(data.dataid,data.userincol)

        let test = commentdb.documents.filter(value=>{
           return value.postid === postid
        })

        const comment = []

    
          
           for(let i =0; i<test.length; i++){
            for(let j = 0; j < userdb.documents.length; j++){
                for(let k =0; k<comdb.documents.length; k++){
                    if(test[i].uesrid === userdb.documents[j].$id && test[i].uesrid === comdb.documents[k].useraccountId
                        ){

                           
                           let com = {
                                commentuserphoto:comdb.documents[k].photoLink,
                                commentusername:`${userdb.documents[j].firstname} ${userdb.documents[j].lastname}`,
                                content:test[i].content,
                                commentid:test[i].$id,
                                commenttime:test[i].commenttime,
                                commentuserid:userdb.documents[j].$id
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