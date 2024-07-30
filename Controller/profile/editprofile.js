const {connectdatabase} = require('../../config/connectDB');
const sdk = require("node-appwrite");

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const nickname = req.body.nickname;
    const state = req.body.state;


    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    let data = await connectdatabase()

    try{

            let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

            let du = dupplicate.documents.filter(value=>{
                return value.$id === userid 
               })
        
               if(!du[0]){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

               let Firstname = du[0].firstname;
               let Lastname = du[0].lastname;
               let Nickname = du[0].nickname;
               let State = du[0].state;


            if(!firstname){
                firstname = Firstname;
            }

            if(!lastname){
                lastname = Lastname;
            }

            if(!nickname){
                nickname = Nickname;
            }

            if(!state){
                state = State;
            }


            await data.databar.updateDocument(
                data.dataid,
                data.colid,
                 du[0].$id,
                {
                    firstname,
                    lastname,
                    nickname,
                    state
                }
            )

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,profile:du[0]})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost