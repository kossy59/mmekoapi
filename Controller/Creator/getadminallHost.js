// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
const creators = require("../../Creators/creators")
let photodb = require("../../Creators/usercomplete")
let userdb = require("../../Creators/userdb")
const { filterBlockedUsers } = require("../../utiils/blockFilter")

const createCreator = async (req,res)=>{

    const userid = req.body.userid;
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    //let data = await connectdatabase()

    try{
        let host = []
        let unverify_host = await creators.find({}).exec()
        let list_of_host = unverify_host.filter(value=>{
            return value.verify!=="live"
        })
        let image1 = await photodb.find({}).exec()
        let list_of_users = await userdb.find({}).exec()
        list_of_host.forEach(value =>{
            let image = image1.find(value1=>{
             return String(value.userid) === String(value1.useraccountId)
            })

            let username ="none"

            let users = list_of_users.find(value1=>{
                return String(value.userid) === String(value1._id)
               })
            let userPhotolink = ""
            if(image?.photoLink){
                userPhotolink = image?.photoLink
            }

            if(users?.username){
                username = users?.username
            }
            delete users._id
            let data = {
                image:userPhotolink,
                userid:value.userid,
                firstname:value.firstname,
                lastname:value.lastname,
                email:value.email,
                dob:value.dob,
                country:value.country,
                city:value.city,
                resident_address:value.address,
                documentType:value.documentType,
                holdingIdPhoto: (value.creatorfiles[0] || { creatorfilelink :""})?.creatorfilelink,
                idPhoto: (value.creatorfiles[1] || { creatorfilelink: "" })?.creatorfilelink,
                idexpire:value.idexpire,
                id:value._id,
                username,
                address: value.address,
                ...users?._doc
            }
            host.push(data)
        })


           if(!list_of_host){
            return res.status(401).json({"ok":false,"message":`No unvrified Host`,hosts:[]})
           }

        // Filter out blocked users from the host list
        // Convert host objects to user-like objects for filtering
        const hostAsUsers = host.map(h => ({
          _id: h.userid,
          id: h.userid,
          userId: h.userid,
          ...h
        }));
        
        const filteredHostAsUsers = await filterBlockedUsers(hostAsUsers, userid);
        
        // Convert back to host format and apply creator_verified filter
        const filteredHost = filteredHostAsUsers
          .filter(h => !h?.creator_verified)
          .map(user => ({
            image: user.image,
            userid: user.userid,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            dob: user.dob,
            country: user.country,
            city: user.city,
            resident_address: user.resident_address,
            documentType: user.documentType,
            holdingIdPhoto: user.holdingIdPhoto,
            idPhoto: user.idPhoto,
            idexpire: user.idexpire,
            id: user.id,
            username: user.username,
            address: user.address,
            ...user
          }));
        
        return res.status(200).json({ "ok": true, "message": `Creator Fetched successfully`, hosts: filteredHost})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createCreator