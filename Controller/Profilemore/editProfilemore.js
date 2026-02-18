// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");

const completedb = require("../../Creators/usercomplete")
const userdb = require("../../Creators/userdb")
const { updateSingleFileToCloudinary } = require("../../utiils/storj")

const updatePost = async (req, res) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 [editProfilemore] Request received");
    console.log("req.file:", req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer
    } : "NO FILE RECEIVED");
    console.log("req.body.data", req.body.data);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const data = JSON.parse(req.body.data);
    console.log("data", data);

    const userid = data.userid;
    const deletePhotolink = data.deletePhotolink;
    const deletePhotoID = data.deletePhotoID;
    const firstname = data.firstname
    const lastname = data.lastname
    const country = data.country
    const aboutme = data.bio
    const username = data.username  // Extract username from request data  

    if (!userid) {
        return res.status(400).json({ "ok": false, 'message': 'User Id invalid!!' })
    }

    /**
     * This implementation allows for in memory file upload manipulation
     * This prevents accessing the filesystem of the hosted server
     */


    // Only update photo if a new file is being uploaded
    // This preserves the current photo if user only changes other fields
    let photoLink = null;
    let photoID = null;

    if (req.file) {
        // New file is being uploaded - delete old one and upload new one
        const result = await updateSingleFileToCloudinary(deletePhotoID, req.file, `profile`);


        photoLink = result.file_link;
        photoID = result.public_id;
    } else {

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
            if (du) {
                du.photoLink = photoLink
                du.photoID = photoID
            }
        }
        if (aboutme) {
            if (du) {
                du.details = aboutme
            }
        }

        // Only save completedb if it exists
        if (du) {
            await du.save()
        }


        if (firstname) {
            usersedit.firstname = firstname
        }
        if (lastname) {
            usersedit.lastname = lastname
        }
        if (country) {
            usersedit.country = country
        }
        // Update bio in userdb as well so it's accessible everywhere
        if (aboutme) {
            usersedit.bio = aboutme
        }
        if (username) {
            // Remove @ prefix if it exists (frontend sends it with @)
            const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
            usersedit.username = `@${cleanUsername}`;  // Store with @ prefix in database

        }

        // Update photolink and photoID in userdb collection so it's accessible everywhere
        if (photoLink && photoID) {
            usersedit.photolink = photoLink
            usersedit.photoID = photoID

        }

        await usersedit.save()




        return res.status(200).json({
            "ok": true,
            "message": `Profile updated Successfully`,
            "profile": {
                photolink: usersedit.photolink,
                photoID: usersedit.photoID,
                firstname: usersedit.firstname,
                lastname: usersedit.lastname,
                username: usersedit.username,
                bio: du.details,
                country: usersedit.country
            }
        })


    } catch (err) {
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }
}

module.exports = updatePost