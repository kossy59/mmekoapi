// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const completedb = require("../../Models/usercomplete")
const userdb = require("../../Models/userdb")
const { updateSingleFileToCloudinary } = require("../../utiils/cloudinary")

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
    const result = await updateSingleFileToCloudinary(deletePhotoID, req.file, `assets/profile/images`);

    console.log("result: ", result)

    const photoLink = result.file_link
    const photoID = result.public_id


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
        }
        if (aboutme) {
            du.details = aboutme
        }
               
        await du.save()


        if (firstname) {
            usersedit.firstname = firstname
        }
        if (lastname) {
            usersedit.lastname = lastname
        }
                 

        if (country) {
            usersedit.country = country
        }

        await usersedit.save()



           

        return res.status(200).json({ "ok": true, "message": `Profile updated Successfully` })
      
          
    } catch (err) {
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }
}

module.exports = updatePost