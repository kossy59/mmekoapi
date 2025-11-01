// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const userdb = require("../../Creators/userdb")
const completedb = require("../../Creators/usercomplete")

const updatePost = async (req,res)=>{
    console.log("📝 [editprofile] Received profile update request");
    const userid = req.body.userid;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const username = req.body.username;
    const bio = req.body.bio;
    const state = req.body.state;
    const photolink = req.body.photolink;
    const photoID = req.body.photoID;
    const deletePhotolink = req.body.deletePhotolink;
    const deletePhotoID = req.body.deletePhotoID;
    
    console.log("📝 [editprofile] Update data:", {
        userid,
        hasPhotolink: !!photolink,
        hasPhotoID: !!photoID,
        hasDeletePhotolink: !!deletePhotolink,
        hasBio: !!bio
    });

  


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
               let duComplete = await completedb.findOne({ useraccountId: userid }).exec()
        
               if(!du){
                return res.status(409).json({"ok":false,'message': 'current user can not edit this profile!!'});
        
               }

               let Firstname = du.firstname;
               let Lastname = du.lastname;
               let Username = du.username;
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

            if(username){
                du.username = username;
            }

            if(bio){
                du.bio = bio;
            }

            if(state){
                du.country = state;
            }

            if(photolink){
                du.photolink = photolink;
                // Also update completedb if it exists
                if(duComplete){
                    duComplete.photoLink = photolink;
                    console.log("✅ [editprofile] Updated completedb.photoLink:", photolink);
                }
            }

            if(photoID){
                du.photoID = photoID;
                // Also update completedb if it exists
                if(duComplete){
                    duComplete.photoID = photoID;
                    console.log("✅ [editprofile] Updated completedb.photoID:", photoID);
                }
            }

            // Handle profile picture deletion
            if(deletePhotolink || deletePhotoID){
                // Clear the profile picture fields in both collections
                du.photolink = "";
                du.photoID = "";
                if(duComplete){
                    duComplete.photoLink = "";
                    duComplete.photoID = "";
                }
                console.log("✅ [editprofile] Profile picture deleted for user:", userid);
            }

            // Update bio in completedb if provided
            if(bio && duComplete){
                duComplete.details = bio;
                console.log("✅ [editprofile] Updated completedb.details (bio)");
            }

            // await data.databar.updateDocument(
            //     data.dataid,
            //     data.colid,
            //      du[0].$id,
            //     {
            //         firstname,
            //         lastname,
            //         username,
            //         state
            //     }
            // )

            // Fields are already updated above with conditional checks

            await du.save()
            if(duComplete){
                await duComplete.save()
                console.log("✅ [editprofile] Saved both userdb and completedb");
            } else {
                console.log("⚠️ [editprofile] completedb not found for user, only saved userdb");
            }

          

            return res.status(200).json({"ok":true,"message":`Post updated Successfully`,profile:du})
      
          
       }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = updatePost