const followerdb = require("../../Models/followers")
const userdb = require("../../Models/userdb")
const admindb = require("../../Models/admindb")

const createModel = async (req,res)=>{

    const followerid = req.body.followerid;
    const userid = req.body.userid

   
    if(!followerid && !userid ){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    let Isfollowed = await followerdb.findOne({followerid:followerid}).exec()

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
            message:`you have new follower ${client.firstname} ${client.lastname}`,
            seen:true
        }

        await admindb.create(respond)

        let follow = {
            userid:userid,
            followerid:followerid
        }

        await followerdb.create(follow)


        return res.status(200).json({"ok":true,"message":`followed successfully`})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel