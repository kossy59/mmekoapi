const admindb = require("../../Creators/admindb")
let userdb = require("../../Creators/userdb")
let deleteaccount = require("../../utiils/Deletes/deleteaccount")
const creators = require("../../Creators/creators");
const exclusivedb = require("../../Creators/exclusivedb");
const exclusivepurchase = require("../../Creators/exclusivePurshase");
const deleteImage = require("../../utiils/deleteImage");

const updatePost = async (req,res)=>{
    const userid = req.body.userid;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    if (!token) {
        return res.status(401).json({ "ok": false, 'message': 'Authorization token required' });
    }

    let user = await userdb.findOne({_id:userid}).exec()

    if(!user){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }
  
   try{
        // Check if user is a creator and delete portfolio
        if (user.creator_portfolio) {
            console.log('Deleting creator portfolio for user:', userid);
            
            // Get creator data
            const creatorData = await creators.findOne({ userid: userid }).exec();
            
            if (creatorData) {
                // Delete creator images
                if (creatorData.photolink) {
                    try {
                        const images = creatorData.photolink.split(",");
                        for (let i = 0; i < images.length; i++) {
                            await deleteImage("post", images[i]);
                        }
                    } catch (err) {
                        console.log("Failed deleting creator images:", err);
                    }
                }

                // Delete all exclusive content
                const exclusiveContent = await exclusivedb.find({ userid: userid }).exec();
                for (let i = 0; i < exclusiveContent.length; i++) {
                    const content = exclusiveContent[i];
                    
                    // Delete thumbnail
                    if (content.thumblink) {
                        try {
                            await deleteImage("post", content.thumblink);
                        } catch (err) {
                            console.log("Failed deleting exclusive thumbnail:", err);
                        }
                    }
                    
                    // Delete content
                    if (content.contentlink) {
                        try {
                            await deleteImage("content", content.contentlink);
                            await deleteImage("post", content.contentlink);
                        } catch (err) {
                            console.log("Failed deleting exclusive content:", err);
                        }
                    }
                }

                // Delete exclusive content records
                await exclusivedb.deleteMany({ userid: userid }).exec();
                
                // Delete exclusive purchases
                await exclusivepurchase.deleteMany({ userid: userid }).exec();
                
                // Delete creator record
                await creators.deleteOne({ userid: userid }).exec();
                
                console.log('Creator portfolio deleted successfully');
            }
        }

        // Delete all other user data
        await deleteaccount(userid);

        return res.status(200).json({
            "ok": true,
            "message": `User deleted successfully${user.creator_portfolio ? ' (including creator portfolio)' : ''}`,
            "id": userid,
            "wasCreator": user.creator_portfolio || false
        });
   }catch(err){
       console.error('Error deleting user:', err);
       return res.status(500).json({"ok":false,'message': `Failed to delete user: ${err.message}`});
   }
}

module.exports = updatePost