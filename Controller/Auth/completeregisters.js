// const {userdb} = require('../../Model/userdb');
// const information = require('../../Model/usercomplete')
// const {connectdatabase} = require('../../config/connectDB');
// var sdk = require("node-appwrite");

const userdb = require("../../Models/usercomplete")


const handleNewUser = async (req, res) => {
    console.log("req.body.data", req.body.data);
    const data = JSON.parse(req.body.data);

    const interestedIn = data.interestedIn;
    // let photoLink = data.photoLink;
    const relationshipType = data.relationshipType;
    const details = data.details;
    const useraccountId = data.useraccountId;
    
    if (!interestedIn && !relationshipType && !details && !useraccountId) {
        return res.status(400).json({ "ok": false, 'message': 'Registeration not complete!!' })
    }

    /**
     * This implementation allows for in memory file upload manipulation
     * This prevents accessing the filesystem of the hosted server
     */
    const result = await uploadSingleFileToCloudinary(req.file, `assets/users`);

    console.log("result: ", result)

    const photoLink = result.file_link
    const photoID = result.public_id

    try {
        let du = await userdb.findOne({ useraccountId: useraccountId }).exec()
        
        if (du) {
            return res.status(409).json({ "ok": false, 'message': 'User Already Register!!' });
    
        }

        const moreuser = {
            useraccountId,
            interestedIn,
            relationshipType,
            details,
            photoLink,
            photoID,
        }

        await userdb.create(moreuser)
            

        // await data.databar.createDocument(data.dataid,data.userincol,sdk.ID.unique(),moreuser)
        return res.status(200).json({ "ok": true, 'message': `Account Created Successful` })

      
          
    } catch (err) {
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }

}

module.exports = handleNewUser;