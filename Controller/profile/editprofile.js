// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Creators/userdb")

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const nickname = req.body.nickname;
    const bio = req.body.bio;
    const state = req.body.state;
    const photolink = req.body.photolink;
    const photoID = req.body.photoID;
    const deletePhotolink = req.body.deletePhotolink;
    const deletePhotoID = req.body.deletePhotoID;

  


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
               let Bio = du.bio;
               let State = du.state;
               let Photolink = du.photolink;
               let PhotoID = du.photoID;


            // Only update fields that are provided in the request
            if(firstname){
                du.firstname = firstname;
            }

            if(lastname){
                du.lastname = lastname;
            }

            if(nickname){
                du.nickname = nickname;
            }

            if(bio){
                du.bio = bio;
            }

            if(state){
                du.country = state;
            }

            if(photolink){
                du.photolink = photolink;
            }

            if(photoID){
                du.photoID = photoID;
            }

            // Handle profile picture deletion
            if(deletePhotolink || deletePhotoID){
                // Clear the profile picture fields
                du.photolink = "";
                du.photoID = "";
                console.log("Profile picture deleted for user:", userid);
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

            // Fields are already updated above with conditional checks

            await du.save()

          

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,profile:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost