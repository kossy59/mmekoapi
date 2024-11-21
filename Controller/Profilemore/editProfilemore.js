// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const completedb = require("../../Models/usercomplete")
const userdb = require("../../Models/userdb")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const photoLink = req.body.photolink;
    let firstname = req.body.firstname
    let lastname = req.body.lastname
    let state = req.body.state
    let country = req.body.country
    let aboutme = req.body.bio
    


    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }


    // let data = await connectdatabase()

    try{

            // let  dupplicate = await data.databar.listDocuments(data.dataid,data.userincol)

            // let du = dupplicate.documents.filter(value=>{
            //     return value.useraccountId === userid 
            //    })

               let du = await completedb.findOne({useraccountId:userid}).exec()
               let usersedit = await userdb.findOne({_id:userid}).exec()
               
               if(!du && !usersedit){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

              

               

                if(photoLink){
                    du.photoLink = photoLink
                }
                 if(aboutme){
                    du.details = aboutme
                }
               
                await du.save()


                 if(firstname){
                    usersedit.firstname = firstname
                }
                 if(lastname){
                    usersedit.lastname = lastname
                }
                 if(state){
                    usersedit.state = state
                }

                 if(country){
                    usersedit.country = country
                }

               await usersedit.save()



           

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost