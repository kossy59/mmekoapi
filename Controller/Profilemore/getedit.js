const completedb = require("../../Creators/usercomplete")
const userdb = require("../../Creators/userdb")

const updatePost = async (req, res) => {
    const userid = req.body.userid;
    
    console.log("🔍 [getedit] Received request for userid:", userid);
    
    if (!userid) {
        return res.status(400).json({ "ok": false, 'message': 'user Id invalid!!' })
    }


    try {

        let du = await completedb.findOne({ useraccountId: userid }).exec()
        let usersedit = await userdb.findOne({ _id: userid }).exec()
        
        console.log("🔍 [getedit] Database query results:", {
            hasCompletedData: !!du,
            hasUserData: !!usersedit,
            completedPhotoLink: du?.photoLink || "none",
            userPhotolink: usersedit?.photolink || "none",
            completedPhotoID: du?.photoID || "none",
            userPhotoID: usersedit?.photoID || "none"
        });
        
        if (!du && !usersedit) {
            return res.status(409).json({ "ok": false, 'message': 'current user can not edit this profile!!' });
        
        }

        // Check both collections for photolink - prioritize completedb.photoLink, fallback to userdb.photolink
        // This ensures we get the photo even if it was only saved to one collection
        const photolink = du?.photoLink || usersedit?.photolink || "";
        const photoID = du?.photoID || usersedit?.photoID || "";
        
        console.log("🔍 [getedit] Selected photo data:", {
            photolink: photolink || "none",
            photoID: photoID || "none",
            source: du?.photoLink ? "completedb" : (usersedit?.photolink ? "userdb" : "none")
        });

        let data = {
            id: usersedit?._id || userid,
            photolink: photolink,
            photoID: photoID,
            firstname: usersedit?.firstname || "",
            lastname: usersedit?.lastname || "",
            state: usersedit?.state || "",
            country: usersedit?.country || "",
            bio: du?.details || "",
            username: usersedit?.username || "",
        }

        console.log("🔍 [getedit] Returning data:", {
            hasPhotolink: !!data.photolink,
            photolink: data.photolink || "none",
            hasPhotoID: !!data.photoID,
            hasUsername: !!data.username,
            hasBio: !!data.bio
        });

        return res.status(200).json({ "ok": true, "message": `Post updated Successfully`, data: data })
      
          
    } catch (err) {
        console.error("❌ [getedit] Error:", err);
        return res.status(500).json({ "ok": false, 'message': `${err.message}!` });
    }
}

module.exports = updatePost