// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Models/userdb")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const nickname = req.body.nickname;
    const state = req.body.state;


    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    //let data = await connectdatabase()

    try{

            // let  dupplicate = await data.databar.listDocuments(data.dataid,data.colid)

            // let du = dupplicate.documents.filter(value=>{
            //     return value.$id === userid 
            //    })

               let du = await userdb.findOne({_id:userid}).exec()
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

               let Firstname = du.firstname;
               let Lastname = du.lastname;
               let Nickname = du.nickname;
               let State = du.state;


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


            // await data.databar.updateDocument(
            //     data.dataid,
            //     data.colid,
            //      du[0].$id,
            //     {
            //         firstname,
            //         lastname,
            //         nickname,
            //         state
            //     }
            // )

            du.firstname = firstname;
            du.lastname = lastname;
            du.nickname = nickname;
            du.state = state;

            du.save()

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,profile:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost