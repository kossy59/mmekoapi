// const {connectdatabase} = require('../../config/connectDB');
// const sdk = require("node-appwrite");
let documentdb = require("../../Models/document")
let photodb = require("../../Models/usercomplete")
let userdb = require("../../Models/userdb")

const createModel = async (req,res)=>{

    const userid = req.body.userid;
   
   
    if(!userid){
        return res.status(400).json({"ok":false,'message': 'user Id invalid!!'})
    }

    //let data = await connectdatabase()

    try{

        let host = []
        let unverify_host = await documentdb.find({}).exec()
        
        let list_of_host = unverify_host.filter(value=>{
            return value.verify === false
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
            if(image.photoLink){
                userPhotolink = image.photoLink
            }

            if(users.nickname){
                username = users.nickname
            }
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
                holdingIdPhoto:value.holdingIdPhoto,
                idPhoto:value.idPhoto,
                idexpire:value.idexpire,
                id:value._id,
                username,
                address:value.address


            }
            host.push(data)
        })


           if(!list_of_host){
            return res.status(401).json({"ok":false,"message":`No unvrified Host`,hosts:[]})
           }

            return res.status(200).json({"ok":true,"message":`Model Fetched successfully`,hosts:host})
      
          
          }catch(err){
           return res.status(500).json({"ok":false,'message': `${err.message}!`});
       }
}

module.exports = createModel