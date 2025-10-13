const followerdb = require("../../Creators/followers")
const userdb = require("../../Creators/userdb")
const admindb = require("../../Creators/admindb")
let sendEmail = require("../../utiils/sendEmailnot")
const { pushActivityNotification } = require("../../utiils/sendPushnot")
const { areUsersBlocked } = require("../../utiils/blockingUtils")

const createCreator = async (req,res)=>{

    const followerid = req.body.followerid;
    const userid = req.body.userid

   
    if(!followerid && !userid ){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    // Check if users have a blocking relationship
    const isBlocked = await areUsersBlocked(userid, followerid);
    if (isBlocked) {
        return res.status(403).json({"ok":false,'message': 'Cannot follow this user due to blocking relationship'})
    }

    let followeds = await followerdb.find({userid:userid}).exec()

    let Isfollowed = followeds.find(value=> value.followerid === followerid)

    if(Isfollowed ){
        return res.status(400).json({"ok":false,'message': 'already followed this user!!'})
    }

    try{

        let client = await userdb.findOne({_id:followerid}).exec()
      
        if(!client ){
            return res.status(400).json({"ok":false,'message': 'this user is not avalable!!'})
        }

       
        let respond = {
            userid:userid,
            message:`${client.firstname} ${client.lastname} followed you`,
            seen:true
        }

        await admindb.create(respond)

        let follow = {
            userid:userid,
            followerid:followerid
        }

        await followerdb.create(follow)
        await sendEmail(userid, "you have new follower")
        await pushActivityNotification(userid, `${client.firstname} ${client.lastname} followed you`, "follow")

        // No need to sync userdb arrays - followers collection is the single source of truth

        // Emit socket event for real-time updates
        try {
            const io = req.app.get('io');
            if (io) {
                io.emit(`follow_update_${userid}`, {
                    action: 'follow',
                    follower: followerid
                });
                io.emit('follow_update', {
                    action: 'follow',
                    target: userid,
                    actor: followerid
                });
            }
        } catch (socketErr) {
            console.log("[follow] socket emit error:", socketErr?.message);
        }

        return res.status(200).json({"ok":true,"message":`followed successfully`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createCreator