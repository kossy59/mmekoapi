// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const completedb = require("../../Creators/usercomplete")
const userdb = require("../../Creators/userdb")
const { updateSingleFileToCloudinary } = require("../../utiils/storj")

const updatePost = async (req, res) => {
    console.log("req.body.data", req.body.data);
    const data = JSON.parse(req.body.data);
    console.log("data", data);

    const userid = data.userid;
    const deletePhotolink = data.deletePhotolink;
    const deletePhotoID = data.deletePhotoID;
    const firstname = data.firstname
    const lastname = data.lastname
    const country = data.country
    const aboutme = data.bio  

    if (!userid) {
        return res.status(400).json({ "ok": false, 'message': 'User Id invalid!!' })
    }

    /**
     * This implementation allows for in memory file upload manipulation
     * This prevents accessing the filesystem of the hosted server
     */
    console.log("📤 [editProfilemore] Starting profile update for user:", userid);
    console.log("📤 [editProfilemore] Request details:", {
        hasFile: !!req.file,
        fileName: req.file?.originalname || "no file",
        fileSize: req.file?.size || 0,
        deletePhotolink: deletePhotolink || "none",
        deletePhotoID: deletePhotoID || "none"
    });

    // Only update photo if a new file is being uploaded
    // This preserves the current photo if user only changes other fields
    let photoLink = null;
    let photoID = null;
    
    if (req.file) {
        // New file is being uploaded - delete old one and upload new one
        const result = await updateSingleFileToCloudinary(deletePhotoID, req.file, `profile`);

        console.log("📤 [editProfilemore] Cloudinary upload result:", {
            hasFileLink: !!result.file_link,
            hasPublicId: !!result.public_id,
            fileLink: result.file_link || "none",
            publicId: result.public_id || "none"
        });

        photoLink = result.file_link;
        photoID = result.public_id;
    } else {
        console.log("📤 [editProfilemore] No new file uploaded - preserving current profile photo");
    }


    // let data = await connectdatabase()

    try {

        // let  dupplicate = await data.databar.listDocuments(data.dataid,data.userincol)

        // let du = dupplicate.documents.filter(value=>{
        //     return value.useraccountId === userid 
        //    })

        let du = await completedb.findOne({ useraccountId: userid }).exec()
        let usersedit = await userdb.findOne({ _id: userid }).exec()
               
        if (!du && !usersedit) {
            return res.status(409).json({ "ok": false, 'message': 'Current user can not edit this profile!!' });
        
        }

              

               

        if (photoLink && photoID) {
            du.photoLink = photoLink
            du.photoID = photoID
            console.log("✅ [editProfilemore] Updated completedb with profile image:", {
                photoLink: photoLink,
                photoID: photoID,
                userid: userid
            });
        }
        if (aboutme) {
            du.details = aboutme
        }
               
        await du.save()
        console.log("✅ [editProfilemore] Saved completedb for user:", userid);


        if (firstname) {
            usersedit.firstname = firstname
        }
        if (lastname) {
            usersedit.lastname = lastname
        }
        if (country) {
            usersedit.country = country
        }
        
        // Update photolink and photoID in userdb collection so it's accessible everywhere
        if (photoLink && photoID) {
            usersedit.photolink = photoLink
            usersedit.photoID = photoID
            console.log("✅ [editProfilemore] Updated userdb with new profile image:", {
                photolink: photoLink,
                photoID: photoID,
                userid: userid
            });
        }

        await usersedit.save()
        console.log("✅ [editProfilemore] Saved userdb for user:", userid);



           

        return res.status(200).json({ 
            "ok": true, 
            "message": `Profile updated Successfully`,
            "profile": {
                photolink: usersedit.photolink,
                photoID: usersedit.photoID,
                firstname: usersedit.firstname,
                lastname: usersedit.lastname,
                bio: du.details,
                country: usersedit.country
            }
        })
      
          
    } catch (err) {
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }
}

module.exports = updatePost